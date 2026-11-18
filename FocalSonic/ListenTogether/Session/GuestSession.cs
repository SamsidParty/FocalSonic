using FocalSonic.ListenTogether.Core;
using FocalSonic.ListenTogether.Transport;
using Newtonsoft.Json.Linq;

namespace FocalSonic.ListenTogether.Session
{
    public class LtJoinException : Exception
    {
        public string Reason { get; }
        public LtJoinException(string reason, string message) : base(message) { Reason = reason; }
    }

    /// <summary>
    /// A guest's side of a session. The guest's player store mirrors the host's session state;
    /// local edits are turned into proposals for the host, shown optimistically until the host
    /// answers. Playback follows the host's timeline through <see cref="LocalSync"/>, which
    /// also keeps going through short disconnects (the timeline doesn't need the host).
    /// </summary>
    public sealed class GuestSession : ILtSession
    {
        public string Role => "guest";
        public bool IsActive => !ended;
        public string Code { get; }
        public string SessionId { get; private set; } = "";
        public string ParticipantId { get; } = "g" + LtIds.New(7);
        public string DisplayName => name;

        readonly ILtApp app;
        readonly string resumeSecret = LtIds.Secret();
        string name;
        readonly SerialExecutor exec = new("guest");
        readonly SignalingClient signaling = new();
        readonly SignalingCipher cipher;
        readonly string roomId;
        SignalingInbox? inbox;
        PeerLink? link;
        readonly ClockSync clock = new();
        readonly LocalSync sync;
        Availability availability;
        readonly StoreTracker tracker = new();
        Timer? ticker;
        TaskCompletionSource<JObject>? pendingAnswer;
        string? pendingAttempt;
        PeerLink? pendingLink;
        readonly CancellationTokenSource lifetime = new();

        // Replicated session state
        readonly Dictionary<string, QueueEntry> entries = new();
        List<string> order = new();
        List<string>? originalOrder;
        string? current;
        bool playing;
        int loop;
        bool shuffle;
        JObject? station;
        int version = -1;
        int fxVersion = -1;
        (double Speed, string Filter)? writtenFx;
        PlaybackAnchor? anchor;
        PlaybackAnchor? localAnchor;
        JObject? latestState;
        JArray peers = new();
        JObject unavailable = new();
        string hostName = "the host";
        LtPermissions permissions = new();
        Dictionary<string, (string? Local, bool Blocked)> sourceMap = new();
        HashSet<string> reportedUnavailable = new();
        string? lastProjectedSignature;

        readonly Dictionary<string, double> pendingOps = new();
        int opCounter;
        int entryCounter;
        double lastPing, lastStatus, lastNeed, lastStatusPublish;
        int pingsSent;
        JObject? queuedFx;
        bool fxScheduled;

        string phase = "connecting";
        string? error;
        string? endReason;
        bool ended;
        bool welcomed;
        bool reconnecting;

        public GuestSession(ILtApp app, string code, string name)
        {
            this.app = app;
            Code = code;
            this.name = LtText.CleanName(name, "Guest");
            cipher = new SignalingCipher(code);
            roomId = JoinCode.RoomId(code);
            availability = new Availability(app.AppleMusicGet, app.Storefront, ParticipantId);
            sync = new LocalSync(app, () => clock.HostNowMs, isHost: false);
            sync.LoadStalled += (source) => OnLoadFailed(source);
        }

        #region Connecting

        public async Task Start(CancellationToken ct)
        {
            PublishStatus();

            try
            {
                await Connect(ct);
            }
            catch (Exception ex)
            {
                await exec.Run(async () =>
                {
                    phase = "failed";
                    error = ex is LtJoinException or SignalingException ? ex.Message : "Couldn't join the session.";
                    ended = true;
                    PublishStatus();
                });
                exec.Dispose();
                throw;
            }

            ticker = new Timer((_) => exec.Post(Tick), null, 250, 250);
        }

        void OnSignal(JObject message)
        {
            var kind = message.Value<string>("t");
            if (message.Value<string>("n") != pendingAttempt) return;
            if (kind == "answer" || kind == "reject") pendingAnswer?.TrySetResult(message);
            else if (kind == "cand") pendingLink?.AddRemoteCandidates(message["cands"] as JArray);
        }

        /// <summary>
        /// Connects (or reconnects) to the host. The reply inbox only exists meanwhile: once
        /// connected nothing more comes through signaling, so there's no reason to keep polling.
        /// </summary>
        async Task Connect(CancellationToken ct)
        {
            inbox = new SignalingInbox(signaling, cipher, "g" + LtIds.Secret()[..39], ttlSeconds: 60);
            inbox.MessageReceived += OnSignal;
            try
            {
                await inbox.Open(ct);
                await ConnectThroughInbox(ct);
            }
            finally
            {
                var finished = inbox;
                inbox = null;
                _ = finished.DisposeAsync().AsTask();
            }
        }

        async Task ConnectThroughInbox(CancellationToken ct)
        {
            Exception? last = null;
            var hostAnswered = false;

            foreach (var profile in new[] { IceProfile.Udp, IceProfile.Tls })
            {
                ct.ThrowIfCancellationRequested();
                PeerLink? candidate = null;

                try
                {
                    var (created, offer) = await PeerLink.CreateOffer(profile, ct);
                    candidate = created;

                    pendingAttempt = LtIds.New(8);
                    pendingLink = created;
                    var attempt = pendingAttempt;
                    created.LateCandidate += (late) => _ = SendLateCandidate(attempt, late);
                    pendingAnswer = new TaskCompletionSource<JObject>(TaskCreationOptions.RunContinuationsAsynchronously);

                    var join = new JObject
                    {
                        ["t"] = "join",
                        ["n"] = pendingAttempt,
                        ["proto"] = LtProtocol.Version,
                        ["pid"] = ParticipantId,
                        ["resume"] = resumeSecret,
                        ["name"] = name,
                        ["sf"] = app.Storefront,
                        ["platform"] = app.Platform,
                        ["app"] = app.AppVersion,
                        ["inbox"] = inbox!.Address,
                        ["offer"] = offer,
                    };

                    try
                    {
                        await signaling.Send(roomId, cipher.Seal(join.ToString()), ct);
                    }
                    catch (SignalingException ex) when (ex.IsNotFound)
                    {
                        throw new LtJoinException("not-found", "There's no session with that code. Check the code, or ask the host whether the session is still on.");
                    }
                    catch (SignalingException ex) when (ex.IsRateLimited)
                    {
                        throw new LtJoinException("rate-limited", "Too many attempts. Wait a minute and try again.");
                    }

                    var answer = await WaitFor(pendingAnswer.Task, TimeSpan.FromSeconds(25), ct);
                    if (answer == null)
                    {
                        throw new LtJoinException("no-answer", "The host isn't responding. They may have lost their connection.");
                    }

                    hostAnswered = true;
                    if (answer.Value<string>("t") == "reject")
                    {
                        throw new LtJoinException(answer.Value<string>("reason") ?? "rejected", answer.Value<string>("message") ?? "The host turned the request down.");
                    }

                    if (answer["answer"] is not JObject sdp) throw new Exception("the host's answer was empty");
                    candidate.ApplyAnswer(sdp);

                    if (await candidate.WaitOpen(TimeSpan.FromSeconds(profile == IceProfile.Udp ? 14 : 20), ct))
                    {
                        await exec.Run(async () => Attach(candidate));
                        return;
                    }

                    LtLog.Warn($"No connection over {profile}; {(profile == IceProfile.Udp ? "trying the relay over TLS" : "giving up")}");
                    candidate.Close("didn't connect");
                }
                catch (LtJoinException ex) when (ex.Reason != "no-answer")
                {
                    candidate?.Close("join refused");
                    throw;
                }
                catch (OperationCanceledException)
                {
                    candidate?.Close("cancelled");
                    throw;
                }
                catch (Exception ex)
                {
                    last = ex;
                    LtLog.Warn($"Connection attempt over {profile} failed: {ex.Message}");
                    candidate?.Close("attempt failed");
                    if (ex is LtJoinException) break;
                }
            }

            if (last is LtJoinException joinException) throw joinException;
            throw new LtJoinException("unreachable", hostAnswered
                ? "Couldn't connect to the host. A firewall or VPN may be blocking the connection."
                : "Couldn't reach the host. " + (last?.Message ?? ""));
        }

        async Task SendLateCandidate(string attempt, JObject candidate)
        {
            try
            {
                await signaling.Send(roomId, cipher.Seal(new JObject
                {
                    ["t"] = "cand",
                    ["pid"] = ParticipantId,
                    ["n"] = attempt,
                    ["cands"] = new JArray(candidate),
                }.ToString()), CancellationToken.None);
            }
            catch (Exception ex) { LtLog.Warn("Couldn't pass on a late candidate: " + ex.Message); }
        }

        static async Task<T?> WaitFor<T>(Task<T> task, TimeSpan timeout, CancellationToken ct) where T : class
        {
            var finished = await Task.WhenAny(task, Task.Delay(timeout, ct));
            ct.ThrowIfCancellationRequested();
            return finished == task ? await task : null;
        }

        void Attach(PeerLink newLink)
        {
            if (ended) { newLink.Close("session over"); return; }

            link?.Close("replaced");
            link = newLink;
            pingsSent = 0;
            lastPing = 0;

            newLink.MessageReceived += (message) =>
            {
                if (message.Value<string>("t") == "pong")
                {
                    var t3 = MonoClock.NowMs;
                    var t0 = message.Value<double?>("t0");
                    var t1 = message.Value<double?>("t1");
                    var t2 = message.Value<double?>("t2");
                    if (t0 != null && t1 != null && t2 != null) clock.AddSample(t0.Value, t1.Value, t2.Value, t3);
                    return;
                }
                exec.Post(() => OnHostMessage(newLink, message));
            };
            newLink.Closed += (closed, reason) => exec.Post(() => OnLinkLost(closed));

            LtLog.Info($"Connected to the host ({newLink.Route ?? "route unknown"})");
            newLink.Release();
            SendPing();
        }

        void OnLinkLost(PeerLink lost)
        {
            if (lost != link || ended) return;
            link = null;
            if (reconnecting) return;

            reconnecting = true;
            phase = "reconnecting";
            LtLog.Info($"Lost the host ({lost.CloseReason}); reconnecting");
            PublishStatus();
            _ = Task.Run(Reconnect);
        }

        async Task Reconnect()
        {
            var started = MonoClock.NowMs;
            var attempt = 0;

            while (!ended && !lifetime.IsCancellationRequested && MonoClock.NowMs - started < 150_000)
            {
                var delay = Math.Min(1000 * Math.Pow(2, attempt), 15_000);
                attempt++;
                try { await Task.Delay(TimeSpan.FromMilliseconds(delay), lifetime.Token); } catch (OperationCanceledException) { return; }

                try
                {
                    await Connect(lifetime.Token);
                    await exec.Run(async () => { reconnecting = false; PublishStatus(); });
                    return;
                }
                catch (LtJoinException ex) when (ex.Reason is "not-found")
                {
                    await Stop("The session has ended.");
                    return;
                }
                catch (LtJoinException ex) when (ex.Reason is "denied" or "conflict" or "version" or "full")
                {
                    await Stop(ex.Message);
                    return;
                }
                catch (OperationCanceledException) { return; }
                catch (Exception ex)
                {
                    LtLog.Warn($"Reconnect attempt {attempt} failed: {ex.Message}");
                }
            }

            if (!ended) await Stop("Lost the connection to the session.");
        }

        #endregion

        #region Messages from the host

        async Task OnHostMessage(PeerLink from, JObject message)
        {
            if (from != link || ended) return;

            switch (message.Value<string>("t"))
            {
                case "welcome":
                    var sid = message.Value<string>("sid") ?? "";
                    if (welcomed && sid != SessionId)
                    {
                        // A different session on the same code (the host restarted it): start clean.
                        tracker.Clear();
                        entries.Clear();
                        version = -1;
                        fxVersion = -1;
                    }
                    SessionId = sid;
                    hostName = (message["host"] as JObject)?.Value<string>("name") ?? hostName;
                    permissions = LtPermissions.FromJson(message["perms"] as JObject);

                    if (!welcomed)
                    {
                        welcomed = true;
                        await app.BeginGuestEffects();
                        app.Notify("success", $"You're listening along with {hostName}");
                    }
                    phase = "live";
                    error = null;
                    PublishStatus();
                    break;

                case "state":
                    AddTracks(message["tracks"] as JObject);
                    var stateVersion = message.Value<int?>("v") ?? -1;
                    if (latestState == null || stateVersion >= (latestState.Value<int?>("v") ?? -1)) latestState = message;
                    await ProjectIfReady();
                    break;

                case "tracks":
                    AddTracks(message["tracks"] as JObject);
                    await ProjectIfReady();
                    break;

                case "anchor":
                    var next = LtProtocol.ParseAnchor(message);
                    if (anchor != null && next.EntryId == anchor.EntryId && next.PlayId == anchor.PlayId && next.Seq < anchor.Seq) break;
                    anchor = next;
                    localAnchor = null;
                    await UpdateSync(load: true);
                    break;

                case "ack":
                    var id = message.Value<string>("id");
                    if (id != null) pendingOps.Remove(id);
                    if (message.Value<bool?>("ok") == false)
                    {
                        app.Notify("error", message.Value<string>("err") ?? "The host couldn't apply that change.");
                        lastProjectedSignature = null; // Put back the host's version.
                    }
                    var warning = message.Value<string>("warn");
                    if (!string.IsNullOrEmpty(warning)) app.Notify("warning", warning);
                    await ProjectIfReady();
                    break;

                case "peers":
                    peers = message["list"] as JArray ?? new JArray();
                    PublishStatus();
                    break;

                case "unavail":
                    unavailable = message["map"] as JObject ?? new JObject();
                    PublishStatus();
                    break;

                case "notice":
                    var text = message.Value<string>("text");
                    if (!string.IsNullOrEmpty(text)) app.Notify("info", text);
                    break;

                case "end":
                    _ = Task.Run(() => Stop("The host ended the session.", pause: true));
                    break;
            }
        }

        void AddTracks(JObject? tracks)
        {
            if (tracks == null) return;
            foreach (var property in tracks.Properties())
            {
                if (property.Value is JObject body && QueueEntry.FromJson(body) is QueueEntry entry)
                {
                    entries[property.Name] = entry;
                }
            }
        }

        async Task ProjectIfReady()
        {
            var state = latestState;
            if (state == null) return;

            // Our own change is on its way to the host: don't flash the old queue meanwhile.
            var now = MonoClock.NowMs;
            foreach (var stale in pendingOps.Where((p) => now - p.Value > 5000).Select((p) => p.Key).ToList()) pendingOps.Remove(stale);
            if (pendingOps.Count > 0) return;

            var newOrder = LtProtocol.Ids(state["order"]);
            var newOriginal = state["orig"] is JArray ? LtProtocol.Ids(state["orig"]) : null;
            var missing = newOrder.Concat(newOriginal ?? new List<string>()).Where((id) => !entries.ContainsKey(id)).Distinct().ToList();

            if (missing.Count > 0)
            {
                if (now - lastNeed > 2000)
                {
                    lastNeed = now;
                    link?.Send(new JObject { ["t"] = "need", ["e"] = new JArray(missing.Take(LtProtocol.MaxQueue)) });
                }
                return;
            }

            var stateVersion = state.Value<int?>("v") ?? 0;
            order = newOrder;
            originalOrder = newOriginal;
            current = state.Value<string>("cur");
            playing = state.Value<bool?>("playing") ?? false;
            loop = state.Value<int?>("loop") ?? 0;
            shuffle = state.Value<bool?>("shuffle") ?? false;
            station = state["station"] as JObject;

            await ApplyEffects(state["fx"] as JObject);

            var live = new HashSet<string>(order.Concat(originalOrder ?? new List<string>()));
            foreach (var gone in entries.Keys.Where((id) => !live.Contains(id)).ToList()) entries.Remove(gone);

            var signature = $"{stateVersion}|{string.Join(",", order.Select((id) => id + "=" + LocalSource(id)))}|{current}|{playing}|{loop}|{shuffle}";
            if (signature != lastProjectedSignature || version != stateVersion)
            {
                lastProjectedSignature = signature;
                version = stateVersion;
                await WriteLocalStore();
            }

            RebuildSourceMap();
            await UpdateSync(load: true);
            PublishStatus();
            _ = Task.Run(RefreshAvailability);
        }

        async Task WriteLocalStore()
        {
            var currentSongs = order.Select(SongFor).ToList();
            var originalSongs = (originalOrder ?? order).Select(SongFor).ToList();
            var index = current != null ? Math.Max(0, order.IndexOf(current)) : 0;

            var write = new LtStoreWrite
            {
                Current = currentSongs,
                Original = originalSongs,
                Index = index,
                Playing = playing && current != null,
                Loop = loop,
                Shuffle = shuffle,
                Station = station,
                RadioId = null,
                Stamp = version,
                SessionId = SessionId,
            };

            await app.WriteStore(write);
            tracker.RecordWrite(version, new LtStoreView
            {
                Current = currentSongs,
                Original = originalSongs,
                Index = index,
                Playing = write.Playing,
                Loop = loop,
                Shuffle = shuffle,
                Station = station,
                Stamp = version,
                StampSession = SessionId,
            }, order.ToList());
        }

        JObject SongFor(string entryId) => LtSongs.ForLocalStore(entries[entryId], availability.Get(entries[entryId]).PlaybackId);

        string? LocalSource(string? entryId)
        {
            if (entryId == null || !entries.TryGetValue(entryId, out var entry)) return null;
            return availability.Get(entry).PlaybackId ?? entry.CatalogId ?? entry.SongId;
        }

        bool IsBlocked(string? entryId) =>
            entryId != null && entries.TryGetValue(entryId, out var entry) && availability.Get(entry).Status == Availability.Status.Unavailable;

        void RebuildSourceMap()
        {
            var map = new Dictionary<string, (string? Local, bool Blocked)>();
            foreach (var id in order)
            {
                if (!entries.TryGetValue(id, out var entry)) continue;
                var source = LocalSource(id);
                if (source != null && IsBlocked(id)) map[source] = (source, true);
            }
            sourceMap = map;
        }

        async Task ApplyEffects(JObject? fx)
        {
            if (fx == null) return;
            var fxV = fx.Value<int?>("v") ?? 0;
            if (fxV == fxVersion) return;
            fxVersion = fxV;

            var speed = fx.Value<double?>("speed") ?? 1;
            var filter = fx.Value<string>("filter") ?? "";
            filter = LocalizeEffects(filter);

            writtenFx = (speed, filter);
            await app.WriteEffects(speed, filter);
        }

        /// <summary>A reverb impulse the host imported from a file isn't here: fall back to the default one.</summary>
        string LocalizeEffects(string filter)
        {
            if (string.IsNullOrEmpty(filter)) return filter;
            try
            {
                var bands = JArray.Parse(filter);
                if (bands.FirstOrDefault() is JObject head)
                {
                    var impulse = head.Value<string>("impulse");
                    if (!string.IsNullOrEmpty(impulse) && !app.HasImpulse(impulse))
                    {
                        head["impulse"] = "";
                        head.Remove("impulseFile");
                        LtLog.Info($"The host's reverb ({impulse}) isn't available here; using the default");
                        return bands.ToString(Newtonsoft.Json.Formatting.None);
                    }
                }
            }
            catch { }
            return filter;
        }

        async Task UpdateSync(bool load)
        {
            if (current == null)
            {
                sync.Reset();
                return;
            }

            PlaybackAnchor target;
            if (localAnchor != null && localAnchor.EntryId == current) target = localAnchor;
            else if (anchor != null && anchor.EntryId == current) target = anchor;
            else
            {
                // The track changed and the host's anchor for it hasn't arrived yet.
                target = new PlaybackAnchor
                {
                    EntryId = current,
                    PlayId = -1,
                    Playing = playing,
                    Pending = playing,
                    Rate = 1,
                    Duration = entries.GetValueOrDefault(current)?.Duration ?? 0,
                };
            }

            await sync.SetTarget(target, LocalSource(current), IsBlocked(current), load);
        }

        async Task RefreshAvailability()
        {
            try
            {
                var snapshot = await exec.Run(() => Task.FromResult(order.Where(entries.ContainsKey).Select((id) => entries[id]).ToList()));
                var changed = await availability.Refresh(snapshot);
                exec.Post(async () =>
                {
                    var mine = new HashSet<string>(order.Where(IsBlocked));
                    if (!mine.SetEquals(reportedUnavailable))
                    {
                        reportedUnavailable = mine;
                        link?.Send(new JObject { ["t"] = "avail", ["unavail"] = new JArray(mine) });
                    }
                    if (changed)
                    {
                        lastProjectedSignature = null;
                        await ProjectIfReady();
                    }
                });
            }
            catch (Exception ex)
            {
                LtLog.Warn("Availability check failed: " + ex.Message);
            }
        }

        #endregion

        #region Local changes

        public void OnStoreChanged() => exec.Post(OnLocalStoreChanged);

        async Task OnLocalStoreChanged()
        {
            if (ended || !welcomed || version < 0) return;

            var view = app.ReadStore();
            if (view.StampSession != SessionId) return;

            var baseState = tracker.Base(view.Stamp);
            if (baseState == null) return; // Based on something long gone; the next update replaces it.

            var ops = new JArray();
            var diff = LocalDiff.Compute(baseState, view, () => $"{ParticipantId}:{++entryCounter}");

            if (view.Shuffle != baseState.View.Shuffle)
            {
                // The host shuffles its own way; the local reshuffle is only a preview.
                ops.Add(new JObject { ["k"] = "shuffle", ["on"] = view.Shuffle });
            }
            else if (diff.OrderChanged || diff.NewItems.Count > 0 || diff.CurrentChanged)
            {
                if (view.Current.Count == 0)
                {
                    ops.Add(new JObject { ["k"] = "clear" });
                }
                else
                {
                    ops.Add(new JObject
                    {
                        ["k"] = "propose",
                        ["base"] = view.Stamp,
                        ["order"] = new JArray(diff.Order),
                        ["removed"] = new JArray(diff.Removed),
                        ["items"] = new JArray(diff.NewItems.Select((item) => new JObject { ["e"] = item.Id, ["song"] = LtSongs.Shareable(item.Song) })),
                        ["cur"] = diff.CurrentChanged ? diff.CurrentAfter : null,
                        ["play"] = diff.CurrentChanged && view.Playing ? true : null,
                    });
                }
            }

            if (view.Playing != baseState.View.Playing && view.Current.Count > 0)
            {
                ops.Add(new JObject { ["k"] = view.Playing ? "play" : "pause" });
            }

            if (view.Loop != baseState.View.Loop)
            {
                ops.Add(new JObject { ["k"] = "loop", ["s"] = view.Loop });
            }

            tracker.RecordLocal(view.Stamp, view, diff.Order);
            if (ops.Count > 0) SendOps(ops);
        }

        void SendOps(JArray ops)
        {
            if (link == null || link.State != PeerLinkState.Open)
            {
                app.Notify("warning", "Reconnecting to the session; that change wasn't sent.");
                lastProjectedSignature = null;
                _ = ProjectIfReady();
                return;
            }

            var id = $"{ParticipantId}-{++opCounter}";
            pendingOps[id] = MonoClock.NowMs;
            link.Send(new JObject { ["t"] = "op", ["id"] = id, ["ops"] = ops });
        }

        public void OnEffectsChanged() => exec.Post(() =>
        {
            if (ended || !welcomed) return;
            var (speed, filter) = app.ReadEffects();
            filter ??= "";
            if (writtenFx != null && writtenFx.Value.Speed == speed && writtenFx.Value.Filter == filter) return;
            writtenFx = (speed, filter);

            // Sliders fire many changes a second; send the latest a few times a second at most.
            queuedFx = new JObject { ["k"] = "fx", ["speed"] = speed, ["filter"] = filter };
            if (fxScheduled) return;
            fxScheduled = true;
            _ = Task.Delay(150).ContinueWith((_) => exec.Post(() =>
            {
                fxScheduled = false;
                if (queuedFx != null) SendOps(new JArray(queuedFx));
                queuedFx = null;
            }));
        });

        public void OnLocalSeek(double position) => exec.Post(async () =>
        {
            if (ended || current == null) return;
            SendOps(new JArray(new JObject { ["k"] = "seek", ["e"] = current, ["pos"] = position }));

            // Show it right away; the host's anchor confirms it a round trip later.
            var basis = anchor != null && anchor.EntryId == current ? anchor : null;
            localAnchor = new PlaybackAnchor
            {
                EntryId = current,
                PlayId = basis?.PlayId ?? -1,
                Position = position,
                HostTimeMs = clock.HostNowMs,
                Rate = basis?.Rate ?? 1,
                Playing = playing,
                Duration = basis?.Duration ?? 0,
                Seq = (basis?.Seq ?? 0) + 100_000,
            };
            await UpdateSync(load: false);
        });

        public void OnTimeUpdate(bool enginePlaying, double position, double duration) =>
            exec.Post(() => sync.OnTimeUpdate(enginePlaying, position, duration));

        public void OnLoaded() => exec.Post(() => sync.OnLoaded());

        public void OnTrackStarted() { }

        public bool OnEngineEnded()
        {
            // The host decides what plays next; wait for it.
            exec.Post(() => sync.OnEngineEnded());
            return true;
        }

        public bool OnUserSkip(bool next)
        {
            exec.Post(() =>
            {
                if (ended || current == null) return;
                SendOps(new JArray(new JObject { ["k"] = next ? "next" : "prev", ["from"] = current }));
            });
            return true;
        }

        public bool OnLoadFailed(string source)
        {
            exec.Post(async () =>
            {
                var entryId = order.FirstOrDefault((id) => LocalSource(id) == source);
                if (entryId == null) return;
                var entry = entries[entryId];
                availability.MarkFailed(entryId);
                app.Notify("warning", $"\"{LtText.Title(entry)}\" can't be played on your account. You'll hear the next song.");
                RebuildSourceMap();
                reportedUnavailable.Add(entryId);
                link?.Send(new JObject { ["t"] = "avail", ["unavail"] = new JArray(reportedUnavailable) });
                await UpdateSync(load: false);
            });
            return true;
        }

        public (string? Source, bool Blocked) ResolveSource(string source)
        {
            var map = sourceMap;
            return map.TryGetValue(source, out var mapped) ? (mapped.Local ?? source, mapped.Blocked) : (source, false);
        }

        #endregion

        #region Tick, leaving, status

        void SendPing()
        {
            if (link?.State != PeerLinkState.Open) return;
            lastPing = MonoClock.NowMs;
            pingsSent++;
            link.Send(new JObject { ["t"] = "ping", ["t0"] = MonoClock.NowMs });
        }

        async Task Tick()
        {
            if (ended) return;
            var now = MonoClock.NowMs;
            sync.Tick();

            if (link?.State == PeerLinkState.Open)
            {
                // Quick pings at first to settle the clock, then a steady trickle.
                var interval = pingsSent < 10 ? 400 : 2000;
                if (now - lastPing > interval) SendPing();

                if (now - lastStatus > 2000)
                {
                    lastStatus = now;
                    link.Send(new JObject
                    {
                        ["t"] = "status",
                        ["sync"] = sync.State,
                        ["drift"] = sync.DriftMs,
                        ["route"] = link.Route,
                        ["rtt"] = double.IsNaN(clock.BestRttMs) ? null : clock.BestRttMs,
                    });
                }

                if (now - link.LastReceivedAt > 12_000) link.Close("host stopped responding");
            }

            // A held update whose acknowledgement got lost.
            if (pendingOps.Count > 0 && pendingOps.Values.Min() < now - 5000) await ProjectIfReady();

            if (now - lastStatusPublish > 1000) PublishStatus();
        }

        public Task Stop(string reason) => Stop(reason, pause: false);

        public void Abort()
        {
            try
            {
                link?.Send(new JObject { ["t"] = "bye" });
                Thread.Sleep(150);
                link?.Close("quit");
            }
            catch { }
        }

        public async Task Stop(string reason, bool pause)
        {
            var first = await exec.Run(async () =>
            {
                if (ended) return false;
                ended = true;
                endReason = reason;
                phase = "ended";
                ticker?.Dispose();
                lifetime.Cancel();

                link?.Send(new JObject { ["t"] = "bye" });
                await Task.Delay(150);
                link?.Close("left");

                try { await app.ClearStamp(); } catch { }
                if (welcomed) { try { await app.EndGuestEffects(); } catch (Exception ex) { LtLog.Warn("Couldn't restore effects: " + ex.Message); } }
                if (pause && playing) { try { await app.HostSetPlaying(false); } catch { } }

                PublishStatus();
                return true;
            });

            if (!first) return;
            exec.Dispose();
        }

        public void PublishStatus()
        {
            lastStatusPublish = MonoClock.NowMs;
            var addedBy = new JObject();
            foreach (var id in order)
            {
                if (entries.TryGetValue(id, out var entry) && entry.AddedBy != ParticipantId) addedBy[id] = entry.AddedBy;
            }

            var substituted = current != null && entries.TryGetValue(current, out var currentEntry) &&
                availability.Get(currentEntry).Status == Availability.Status.Substituted;

            app.PublishStatus(new JObject
            {
                ["active"] = !ended,
                ["role"] = "guest",
                ["phase"] = phase,
                ["error"] = error,
                ["endReason"] = endReason,
                ["code"] = JoinCode.Format(Code),
                ["you"] = ParticipantId,
                ["name"] = name,
                ["hostName"] = hostName,
                ["participants"] = peers,
                ["route"] = link?.Route,
                ["rtt"] = double.IsNaN(clock.BestRttMs) ? null : Math.Round(clock.BestRttMs),
                ["sync"] = new JObject { ["state"] = sync.State, ["drift"] = sync.DriftMs, ["corrections"] = sync.Corrections },
                ["current"] = new JObject
                {
                    ["entry"] = current,
                    ["blocked"] = IsBlocked(current),
                    ["substituted"] = substituted,
                    ["title"] = current != null ? LtText.Title(entries.GetValueOrDefault(current)) : null,
                },
                ["permissions"] = permissions.ToJson(),
                ["addedBy"] = addedBy,
                ["unavailable"] = unavailable,
            });
        }

        public Task Rename(string newName) => exec.Run(async () => { name = LtText.CleanName(newName, name); PublishStatus(); });

        public void SetUserOffset(double seconds) => exec.Post(() => { sync.UserOffsetSec = seconds; });

        #endregion
    }
}
