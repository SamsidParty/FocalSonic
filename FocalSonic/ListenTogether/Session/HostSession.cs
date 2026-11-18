using FocalSonic.ListenTogether.Core;
using FocalSonic.ListenTogether.Transport;
using Newtonsoft.Json.Linq;

namespace FocalSonic.ListenTogether.Session
{
    /// <summary>
    /// The host's side of a session, and its single source of truth. The host's own player
    /// store is the session queue: guests send proposals, the host merges them into its store,
    /// and every change is broadcast with a version number. Playback follows a timeline anchor
    /// the host owns (see <see cref="PlaybackAnchor"/>).
    /// </summary>
    public sealed class HostSession : ILtSession
    {
        public string Role => "host";
        public bool IsActive => !ended;
        public string Code { get; }
        public string SessionId { get; } = LtIds.New(12);
        public string ParticipantId { get; } = "h" + LtIds.New(7);
        public string Name { get; private set; }

        readonly ILtApp app;
        readonly SerialExecutor exec = new("host");
        readonly SignalingClient signaling;
        readonly SignalingCipher cipher;
        SignalingInbox? room;
        readonly Dictionary<string, Participant> participants = new();
        readonly Availability availability;
        readonly LocalSync sync;
        readonly StoreTracker tracker = new();
        Timer? ticker;

        /// <summary>Admission hook for later (approvals, bans). Allows everyone for now.</summary>
        public Func<JObject, Task<bool>> Admit = (_) => Task.FromResult(true);

        // Session state
        readonly Dictionary<string, QueueEntry> entries = new();
        readonly Dictionary<string, JObject> hostSongs = new();
        List<string> order = new();
        List<string> originalOrder = new();
        string? current;
        bool playing;
        int loop;
        bool shuffle;
        JObject? station;
        string? radioId;
        int version;
        readonly Dictionary<int, HashSet<string>> orderHistory = new();
        double speed = 1;
        string filterData = "";
        int fxVersion;
        string? lastReadFilter;

        PlaybackAnchor anchor = new();
        int playIdCounter;
        double pendingSince;
        double trackStartedAt;
        int advancedForPlayId = -1;
        int skippedForPlayId = -1;
        double lastEnginePosition;
        Dictionary<string, (string? Local, bool Blocked)> sourceMap = new();
        int entryCounter;

        string phase = "starting";
        string? error;
        double lastAnchorBroadcast, lastPeersBroadcast, lastStatusPublish;
        bool ended;

        public HostSession(ILtApp app, string name)
        {
            this.app = app;
            Name = LtText.CleanName(name, "Host");
            Code = JoinCode.Generate();
            signaling = new SignalingClient();
            cipher = new SignalingCipher(Code);
            availability = new Availability(app.AppleMusicGet, app.Storefront, ParticipantId);
            sync = new LocalSync(app, () => MonoClock.NowMs, isHost: true);
            sync.LoadStalled += (source) => OnLoadFailed(source);
        }

        #region Lifecycle

        public async Task Start(CancellationToken ct)
        {
            LtLog.Info($"Hosting session {SessionId}");

            await exec.Run(async () =>
            {
                var (speedNow, filterNow) = app.ReadEffects();
                speed = speedNow;
                filterData = filterNow ?? "";
                lastReadFilter = filterData;
                await OnLocalStoreChanged(initial: true);
            });

            room = new SignalingInbox(signaling, cipher, JoinCode.RoomId(Code), ttlSeconds: 90);
            room.MessageReceived += (message) => exec.Post(() => OnSignal(message));
            room.Faulted += (reason) => exec.Post(() =>
            {
                app.Notify("warning", "Having trouble reaching the Listen Together server. People may not be able to join right now.");
            });

            try
            {
                await room.Open(ct);
            }
            catch (Exception ex)
            {
                await exec.Run(async () => { phase = "failed"; error = ex is SignalingException ? ex.Message : "Couldn't start the session."; PublishStatus(); });
                throw;
            }

            await exec.Run(async () => { phase = "live"; PublishStatus(); });
            ticker = new Timer((_) => exec.Post(Tick), null, 250, 250);
            _ = Task.Run(RefreshAvailability);
        }

        public void Abort()
        {
            try
            {
                foreach (var participant in participants.Values.ToList())
                {
                    participant.Link?.Send(new JObject { ["t"] = "end", ["reason"] = "The host ended the session." });
                }
                Thread.Sleep(200);
                foreach (var participant in participants.Values.ToList()) participant.Link?.Close("host quit");
                _ = room?.DisposeAsync().AsTask();
            }
            catch { }
        }

        public async Task Stop(string reason)
        {
            await exec.Run(async () =>
            {
                if (ended) return;
                ended = true;
                phase = "ended";
                ticker?.Dispose();

                foreach (var participant in participants.Values)
                {
                    participant.Link?.Send(new JObject { ["t"] = "end", ["reason"] = reason });
                }

                // Let the goodbyes go out before the links close.
                await Task.Delay(250);
                foreach (var participant in participants.Values) participant.Link?.Close("session ended");

                try { await app.ClearStamp(); } catch (Exception ex) { LtLog.Warn("Couldn't clear the session stamp: " + ex.Message); }
                PublishStatus();
            });

            if (room != null) await room.DisposeAsync();
            exec.Dispose();
        }

        #endregion

        #region Signaling (joins)

        readonly Dictionary<string, PeerLink> connecting = new();

        async Task OnSignal(JObject message)
        {
            if (ended) return;
            if (message.Value<string>("t") == "cand")
            {
                if (connecting.TryGetValue($"{message.Value<string>("pid")}/{message.Value<string>("n")}", out var pendingLink))
                {
                    pendingLink.AddRemoteCandidates(message["cands"] as JArray);
                }
                return;
            }
            if (message.Value<string>("t") != "join") return;

            var guestInbox = message.Value<string>("inbox");
            var pid = message.Value<string>("pid");
            if (string.IsNullOrEmpty(guestInbox) || string.IsNullOrEmpty(pid) || pid.Length > 32 || message["offer"] is not JObject offer) return;

            async Task Reject(string reason, string text)
            {
                LtLog.Info($"Turned away {pid}: {text}");
                try { await signaling.Send(guestInbox, cipher.Seal(new JObject { ["t"] = "reject", ["reason"] = reason, ["message"] = text, ["n"] = message["n"] }.ToString()), CancellationToken.None); }
                catch (Exception ex) { LtLog.Warn("Couldn't send a rejection: " + ex.Message); }
            }

            var proto = message.Value<int?>("proto") ?? 0;
            if (proto != LtProtocol.Version)
            {
                await Reject("version", proto < LtProtocol.Version
                    ? "This session needs a newer version of FocalSonic. Update FocalSonic to join."
                    : "The host is using an older version of FocalSonic. Ask them to update.");
                return;
            }

            var resumeHash = LtIds.Hash(message.Value<string>("resume") ?? "");
            participants.TryGetValue(pid, out var participant);

            if (participant != null && participant.ResumeHash != resumeHash)
            {
                await Reject("conflict", "Couldn't join this session. Try again.");
                return;
            }

            if (participant == null && participants.Count >= LtProtocol.MaxParticipants - 1)
            {
                await Reject("full", "This session is full.");
                return;
            }

            if (participant == null && !await Admit(message))
            {
                await Reject("denied", "The host didn't let you in.");
                return;
            }

            if (participant == null)
            {
                participant = new Participant
                {
                    Id = pid,
                    ResumeHash = resumeHash,
                };
                participants[pid] = participant;
            }

            participant.Name = LtText.CleanName(message.Value<string>("name"), "Guest");
            participant.Storefront = (message.Value<string>("sf") ?? "").ToLowerInvariant();
            participant.Platform = message.Value<string>("platform") ?? "";

            var target = participant;
            var attemptKey = $"{pid}/{message.Value<string>("n")}";
            var attempt = message["n"];
            _ = Task.Run(async () =>
            {
                PeerLink? link = null;
                try
                {
                    var (accepted, answer) = await PeerLink.Accept(offer, CancellationToken.None);
                    link = accepted;
                    exec.Post(() => { connecting[attemptKey] = accepted; });
                    accepted.LateCandidate += (late) => _ = Task.Run(async () =>
                    {
                        try
                        {
                            await signaling.Send(guestInbox, cipher.Seal(new JObject { ["t"] = "cand", ["n"] = attempt, ["cands"] = new JArray(late) }.ToString()), CancellationToken.None);
                        }
                        catch (Exception ex) { LtLog.Warn("Couldn't pass on a late candidate: " + ex.Message); }
                    });
                    link.MessageReceived += (msg) => OnLinkMessage(target, link, msg);
                    link.Closed += (closed, reason) => exec.Post(() => OnLinkClosed(target, closed));

                    await signaling.Send(guestInbox, cipher.Seal(new JObject { ["t"] = "answer", ["sid"] = SessionId, ["answer"] = answer, ["n"] = message["n"] }.ToString()), CancellationToken.None);

                    var opened = await link.WaitOpen(TimeSpan.FromSeconds(30), CancellationToken.None);
                    exec.Post(() => { connecting.Remove(attemptKey); });
                    if (opened)
                    {
                        exec.Post(() => Attach(target, link));
                    }
                    else
                    {
                        link.Close("didn't connect in time");
                    }
                }
                catch (Exception ex)
                {
                    LtLog.Warn($"Couldn't connect to {target.Name}: {ex.Message}");
                    link?.Close("setup failed");
                }
            });
        }

        void Attach(Participant participant, PeerLink link)
        {
            if (ended || link.State != PeerLinkState.Open) { link.Close("session over"); return; }

            var returning = participant.EverConnected;
            if (participant.Link != null && participant.Link != link) participant.Link.Close("replaced");

            participant.Link = link;
            participant.EverConnected = true;
            participant.DisconnectedAt = 0;
            participant.SentEntries.Clear();
            participant.LastSentVersion = -1;
            link.Release();

            LtLog.Info($"{participant.Name} {(returning ? "reconnected" : "joined")} ({link.Route ?? "route unknown"})");

            link.Send(new JObject
            {
                ["t"] = "welcome",
                ["proto"] = LtProtocol.Version,
                ["sid"] = SessionId,
                ["you"] = participant.Id,
                ["host"] = new JObject { ["id"] = ParticipantId, ["name"] = Name, ["sf"] = app.Storefront },
                ["perms"] = participant.Permissions.ToJson(),
            });
            SendState(participant);
            link.Send(LtProtocol.Anchor(anchor));
            SendUnavailable(participant);

            if (!returning)
            {
                app.Notify("info", $"{participant.Name} joined");
                Broadcast(new JObject { ["t"] = "notice", ["text"] = $"{participant.Name} joined" }, except: participant);
            }
            BroadcastPeers();
            PublishStatus();
        }

        void OnLinkClosed(Participant participant, PeerLink link)
        {
            if (participant.Link != link) return;
            participant.Link = null;
            participant.DisconnectedAt = MonoClock.NowMs;
            LtLog.Info($"{participant.Name} disconnected ({link.CloseReason})");
            BroadcastPeers();
            PublishStatus();
        }

        void OnLinkMessage(Participant participant, PeerLink link, JObject message)
        {
            // Clock pings are answered right here, not behind whatever the executor is doing,
            // or queueing delay would land in the measured round trip.
            if (message.Value<string>("t") == "ping")
            {
                var received = MonoClock.NowMs;
                link.Send(new JObject { ["t"] = "pong", ["t0"] = message["t0"], ["t1"] = received, ["t2"] = MonoClock.NowMs });
                return;
            }

            exec.Post(() => OnGuestMessage(participant, link, message));
        }

        async Task OnGuestMessage(Participant participant, PeerLink link, JObject message)
        {
            if (ended || participant.Link != link) return;

            switch (message.Value<string>("t"))
            {
                case "op":
                    await OnOps(participant, message);
                    break;

                case "status":
                    participant.Status = new ParticipantStatus
                    {
                        Sync = message.Value<string>("sync") ?? "waiting",
                        DriftMs = message.Value<double?>("drift"),
                        Route = message.Value<string>("route"),
                        RttMs = message.Value<double?>("rtt"),
                    };
                    break;

                case "avail":
                    participant.Unavailable = new HashSet<string>(LtProtocol.Ids(message["unavail"]));
                    BroadcastUnavailable();
                    break;

                case "need":
                    var wanted = LtProtocol.Ids(message["e"]).Where(entries.ContainsKey).Take(LtProtocol.MaxQueue).ToList();
                    if (wanted.Count > 0)
                    {
                        participant.Link?.Send(new JObject
                        {
                            ["t"] = "tracks",
                            ["tracks"] = new JObject(wanted.Select((id) => new JProperty(id, entries[id].ToJson()))),
                        });
                        foreach (var id in wanted) participant.SentEntries.Add(id);
                    }
                    break;

                case "bye":
                    participants.Remove(participant.Id);
                    participant.Link?.Close("left");
                    app.Notify("info", $"{participant.Name} left");
                    Broadcast(new JObject { ["t"] = "notice", ["text"] = $"{participant.Name} left" });
                    BroadcastPeers();
                    BroadcastUnavailable();
                    PublishStatus();
                    break;
            }
        }

        #endregion

        #region Guest operations

        async Task OnOps(Participant participant, JObject message)
        {
            var requestId = message.Value<string>("id");
            string? failure = null;
            var warnings = new List<string>();

            foreach (var op in (message["ops"] as JArray)?.OfType<JObject>() ?? Enumerable.Empty<JObject>())
            {
                var kind = op.Value<string>("k") ?? "";
                if (!participant.Permissions.Allows(kind))
                {
                    failure = "The host hasn't allowed you to do that.";
                    continue;
                }

                try
                {
                    var warning = await ApplyOp(participant, kind, op);
                    if (warning != null) warnings.Add(warning);
                }
                catch (Exception ex)
                {
                    LtLog.Error($"Op {kind} from {participant.Name} failed: {ex}");
                    failure = "Something went wrong applying that change.";
                }
            }

            // Pick up what the app did in response (play/pause, next...) before acknowledging,
            // so the guest has the result by the time it stops holding its own version.
            await OnLocalStoreChanged();

            participant.Link?.Send(new JObject
            {
                ["t"] = "ack",
                ["id"] = requestId,
                ["ok"] = failure == null,
                ["err"] = failure,
                ["warn"] = warnings.Count > 0 ? string.Join("\n", warnings) : null,
                ["v"] = version,
            });
        }

        async Task<string?> ApplyOp(Participant participant, string kind, JObject op)
        {
            switch (kind)
            {
                case "propose":
                    return await ApplyProposal(participant, op);

                case "play":
                case "pause":
                    if (current != null && playing != (kind == "play")) await app.HostSetPlaying(kind == "play");
                    return null;

                case "seek":
                    if (op.Value<string>("e") == current && current != null)
                    {
                        var position = Math.Max(0, op.Value<double?>("pos") ?? 0);
                        await SeekTo(position, fromHost: false);
                    }
                    return null;

                case "next":
                case "prev":
                    if (op.Value<string>("from") == current)
                    {
                        if (kind == "next") await app.HostNext(); else await app.HostPrevious();
                    }
                    return null;

                case "loop":
                    var newLoop = Math.Clamp(op.Value<int?>("s") ?? 0, 0, 3);
                    if (newLoop == LtLoop.InfiniteRadio && string.IsNullOrEmpty(radioId)) newLoop = LtLoop.Off;
                    if (newLoop != loop)
                    {
                        loop = newLoop;
                        await Commit(writeStore: true);
                    }
                    return null;

                case "shuffle":
                    var on = op.Value<bool?>("on") ?? false;
                    if (on != shuffle) await app.HostSetShuffle(on);
                    return null;

                case "fx":
                    var newSpeed = op.Value<double?>("speed") ?? speed;
                    var newFilter = op.Value<string>("filter") ?? filterData;
                    if (newFilter.Length > 64 * 1024) return "Those effects are too large to share.";
                    if (double.IsNaN(newSpeed) || newSpeed == 0) newSpeed = 1;
                    newSpeed = Math.Sign(newSpeed) * Math.Clamp(Math.Abs(newSpeed), 0.0625, 16);
                    await app.WriteEffects(newSpeed, newFilter);
                    await OnLocalEffectsChanged();
                    return null;

                case "clear":
                    order = new List<string>();
                    originalOrder = new List<string>();
                    await SetCurrent(null, startTrack: true);
                    playing = false;
                    await Commit(writeStore: true);
                    return null;
            }

            return null;
        }

        async Task<string?> ApplyProposal(Participant participant, JObject op)
        {
            var baseVersion = op.Value<int?>("base") ?? -1;
            var proposed = LtProtocol.Ids(op["order"]);
            var removed = new HashSet<string>(LtProtocol.Ids(op["removed"]));
            var newIds = new HashSet<string>();
            var added = new List<QueueEntry>();
            string? warning = null;

            foreach (var item in (op["items"] as JArray)?.OfType<JObject>().Take(LtProtocol.MaxItemsPerOp) ?? Enumerable.Empty<JObject>())
            {
                var id = item.Value<string>("e");
                // Guests name their own entries "<their id>:<n>", so ids never collide.
                if (string.IsNullOrEmpty(id) || !id.StartsWith(participant.Id + ":") || entries.ContainsKey(id)) continue;
                if (item["song"] is not JObject song) continue;

                var entry = QueueEntry.FromSong(id, song, participant.Id, participant.Storefront);
                if (entry == null) continue;

                entries[id] = entry;
                newIds.Add(id);
                added.Add(entry);
            }

            orderHistory.TryGetValue(baseVersion, out var baseSet);
            var merged = QueueMatcher.Merge(order, baseSet, proposed, removed, newIds);

            if (merged.Count > LtProtocol.MaxQueue)
            {
                merged = merged.Take(LtProtocol.MaxQueue).ToList();
                warning = $"The queue can hold up to {LtProtocol.MaxQueue} songs; the rest weren't added.";
            }

            var libraryOnly = added.Where((e) => e.CatalogId == null && merged.Contains(e.EntryId)).ToList();
            if (libraryOnly.Count > 0)
            {
                warning = (warning == null ? "" : warning + "\n") +
                    $"{LtText.Songs(libraryOnly.Count, libraryOnly[0])} {(libraryOnly.Count == 1 ? "is" : "are")} only in your library, so only you will hear {(libraryOnly.Count == 1 ? "it" : "them")}.";
            }

            // Where the current song goes: wherever the proposer moved it to, or if they removed
            // it, the song that took its place.
            var requestedCurrent = op.Value<string>("cur");
            string? nextCurrent = current;
            var jump = false;

            if (requestedCurrent != null && merged.Contains(requestedCurrent))
            {
                jump = requestedCurrent != current || op.Value<bool?>("restart") == true;
                nextCurrent = requestedCurrent;
            }
            else if (current != null && !merged.Contains(current))
            {
                var oldIndex = order.IndexOf(current);
                nextCurrent = merged.Count == 0 ? null : merged[Math.Clamp(oldIndex, 0, merged.Count - 1)];
                jump = true;
            }

            if (shuffle)
            {
                var keep = new HashSet<string>(merged);
                var nextOriginal = originalOrder.Where(keep.Contains).ToList();
                foreach (var id in merged)
                {
                    if (nextOriginal.Contains(id)) continue;
                    var index = merged.IndexOf(id);
                    var predecessor = index > 0 ? nextOriginal.IndexOf(merged[index - 1]) : -1;
                    nextOriginal.Insert(predecessor >= 0 ? predecessor + 1 : nextOriginal.Count, id);
                }
                originalOrder = nextOriginal;
            }
            else
            {
                originalOrder = merged.ToList();
            }

            order = merged;
            if (op.Value<bool?>("play") == true) playing = true;
            if (merged.Count == 0) playing = false;

            await SetCurrent(nextCurrent, startTrack: jump, load: true);
            await Commit(writeStore: true);

            var addedHere = added.Where((e) => order.Contains(e.EntryId)).ToList();
            if (addedHere.Count > 0)
            {
                var text = $"{participant.Name} added {LtText.Songs(addedHere.Count, addedHere[0])}";
                app.Notify("info", text);
                Broadcast(new JObject { ["t"] = "notice", ["text"] = text }, except: participant);
                _ = Task.Run(RefreshAvailability);
            }

            return warning;
        }

        #endregion

        #region Local changes (the host's UI and the app's own queue logic)

        public void OnStoreChanged() => exec.Post(() => OnLocalStoreChanged());

        async Task OnLocalStoreChanged(bool initial = false)
        {
            if (ended) return;

            var view = app.ReadStore();
            if (view.MediaType != "song")
            {
                // Internet radio and the like can't be shared.
                view = new LtStoreView { Playing = false, Stamp = view.Stamp, StampSession = view.StampSession };
            }

            var stamp = view.StampSession == SessionId ? view.Stamp : -1;
            var baseState = tracker.Base(stamp)
                ?? tracker.Base(tracker.LatestWritten)
                ?? new StoreTracker.Recorded(new LtStoreView(), new List<string>());

            var diff = LocalDiff.Compute(baseState, view, () => $"{ParticipantId}:{++entryCounter}");

            foreach (var (id, song) in diff.NewItems)
            {
                var entry = QueueEntry.FromSong(id, song, ParticipantId, app.Storefront);
                if (entry != null) entries[id] = entry;
            }

            for (int i = 0; i < diff.Order.Count; i++) hostSongs[diff.Order[i]] = view.Current[i];
            tracker.RecordLocal(stamp, view, diff.Order);

            // The UI's copy hadn't caught up with our last write: merge instead of overwrite.
            var stale = !initial && tracker.LatestWritten >= 0 && stamp != tracker.LatestWritten;

            var originalIds = MatchOriginal(view, diff.Order);
            var changedPlaying = view.Playing != baseState.View.Playing;

            if (!stale)
            {
                order = diff.Order;
                originalOrder = view.Shuffle ? originalIds : order.ToList();
                loop = view.Loop;
                shuffle = view.Shuffle;
                station = view.Station;
                radioId = view.RadioId;

                var newPlaying = view.Playing && diff.CurrentAfter != null;
                if (diff.CurrentChanged || initial)
                {
                    playing = newPlaying;
                    await SetCurrent(diff.CurrentAfter, startTrack: true, load: false, startAt: initial ? app.EnginePosition : 0);
                }
                else
                {
                    await SetPlaying(newPlaying);
                }
                await Commit(writeStore: false);
            }
            else
            {
                LtLog.Info($"Merging a local change made on version {stamp} into version {version}");
                var merged = QueueMatcher.Merge(order, new HashSet<string>(baseState.Ids), diff.Order, diff.Removed,
                    new HashSet<string>(diff.NewItems.Select((n) => n.Id)));

                var nextCurrent = diff.CurrentChanged && diff.CurrentAfter != null && merged.Contains(diff.CurrentAfter)
                    ? diff.CurrentAfter
                    : current != null && merged.Contains(current) ? current
                    : merged.Count > 0 ? merged[Math.Clamp(order.IndexOf(current ?? ""), 0, merged.Count - 1)] : null;

                var jump = nextCurrent != current;
                order = merged;
                if (!shuffle) originalOrder = order.ToList();
                else originalOrder = originalOrder.Where(order.Contains).Concat(order.Where((id) => !originalOrder.Contains(id))).ToList();
                if (view.Loop != baseState.View.Loop) loop = view.Loop;

                if (changedPlaying && jump) playing = view.Playing && nextCurrent != null;
                await SetCurrent(nextCurrent, startTrack: jump, load: jump);
                if (changedPlaying && !jump) await SetPlaying(view.Playing && current != null);
                await Commit(writeStore: true);
            }
        }

        List<string> MatchOriginal(LtStoreView view, List<string> currentIds)
        {
            var baseItems = currentIds.Select((id, i) => new QueueMatcher.BaseItem(id, LtSongs.SongIdOf(view.Current[i]))).ToList();
            var matched = QueueMatcher.Match(baseItems, view.Original);
            var seen = new HashSet<string>();
            var result = matched.Where((id) => id != null && seen.Add(id)).Select((id) => id!).ToList();
            // Anything missing from the original order goes at the end so nothing is lost on unshuffle.
            result.AddRange(currentIds.Where((id) => !seen.Contains(id)));
            return result;
        }

        /// <summary>The app started playing a track (MediaPlaybackInfo.PlaySong), possibly the same one again.</summary>
        public void OnTrackStarted() => exec.Post(async () =>
        {
            if (ended) return;
            await OnLocalStoreChanged();
            // Same entry, started again (repeat one, or the user replaying it).
            if (current != null && MonoClock.NowMs - trackStartedAt > 1500)
            {
                await SetCurrent(current, startTrack: true, load: false);
                BroadcastAnchor();
            }
        });

        public void OnEffectsChanged() => exec.Post(OnLocalEffectsChanged);

        async Task OnLocalEffectsChanged()
        {
            if (ended) return;
            var (newSpeed, newFilter) = app.ReadEffects();
            newFilter ??= "";
            if (newSpeed == speed && newFilter == filterData) return;

            var oldRate = LtProtocol.EffectiveRate(speed);
            var newRate = LtProtocol.EffectiveRate(newSpeed);
            speed = newSpeed;
            filterData = newFilter;
            fxVersion++;

            if (Math.Abs(oldRate - newRate) > 1e-6)
            {
                Reanchor(playing, rate: newRate);
                BroadcastAnchor();
            }

            await Commit(writeStore: false, force: true);
        }

        public void OnLocalSeek(double position) => exec.Post(() => SeekTo(position, fromHost: true));

        async Task SeekTo(double position, bool fromHost)
        {
            if (ended || current == null) return;
            if (anchor.Duration > 0) position = Math.Min(position, Math.Max(0, anchor.Duration - 0.5));

            anchor.Position = position;
            anchor.HostTimeMs = MonoClock.NowMs;
            // Like a resume: the timeline goes on once the engine here is playing again.
            anchor.Pending = playing && !IsBlocked(current);
            pendingSince = MonoClock.NowMs;
            anchor.Seq++;
            BroadcastAnchor();

            if (!fromHost) await app.Seek(position);
            await sync.SetTarget(anchor, LocalSource(current), IsBlocked(current), load: false);
        }

        public void OnTimeUpdate(bool enginePlaying, double position, double duration) => exec.Post(async () =>
        {
            if (ended) return;

            var now = MonoClock.NowMs;
            var source = current != null ? LocalSource(current) : null;

            if (duration > 0 && current != null && app.EngineSource == source && Math.Abs(anchor.Duration - duration) > 0.5)
            {
                anchor.Duration = duration;
            }

            // The track has really started here: that's where everyone's timeline begins.
            // (It has to have moved: the first report after play can still be the old position.)
            if (anchor.Pending && playing && enginePlaying && position > anchor.Position + 0.03 &&
                position < anchor.Position + (anchor.Position < 0.5 ? 30 : 4) &&
                source != null && app.EngineSource == source && app.EngineLoaded)
            {
                anchor.Position = position;
                anchor.HostTimeMs = now;
                anchor.Pending = false;
                anchor.Seq++;
                LtLog.Info($"Track started at {position:F2}s");
                BroadcastAnchor();
                await sync.SetTarget(anchor, source, IsBlocked(current), load: false);
            }

            // Repeat one loops inside the engine, without the app noticing: start a new play.
            if (loop == LtLoop.One && !anchor.Pending && anchor.Duration > 0 &&
                lastEnginePosition > anchor.Duration - 6 && position < 3 && enginePlaying)
            {
                await SetCurrent(current, startTrack: true, load: false);
                anchor.Position = position;
                anchor.HostTimeMs = now;
                anchor.Pending = false;
                BroadcastAnchor();
            }

            lastEnginePosition = position;
            await sync.OnTimeUpdate(enginePlaying, position, duration);
        });

        public void OnLoaded() => exec.Post(() => sync.OnLoaded());

        public bool OnEngineEnded()
        {
            exec.Post(() => sync.OnEngineEnded());
            return false; // The app moves on as usual.
        }

        public bool OnUserSkip(bool next) => false;

        public bool OnLoadFailed(string source)
        {
            exec.Post(async () =>
            {
                var entryId = current != null && LocalSource(current) == source ? current : order.FirstOrDefault((id) => LocalSource(id) == source);
                if (entryId == null || !entries.TryGetValue(entryId, out var entry)) return;

                LtLog.Warn($"Couldn't play \"{LtText.Title(entry)}\" here");
                availability.MarkFailed(entry.EntryId);
                app.Notify("warning", $"\"{LtText.Title(entry)}\" can't be played on your account. Others will still hear it.");
                RebuildSourceMap();
                if (entry.EntryId == current)
                {
                    if (anchor.Pending) { anchor.Pending = false; anchor.HostTimeMs = MonoClock.NowMs; anchor.Seq++; BroadcastAnchor(); }
                    await sync.SetTarget(anchor, LocalSource(current), true, load: false);
                }
                BroadcastUnavailable();
            });
            return true;
        }

        public (string? Source, bool Blocked) ResolveSource(string source)
        {
            var map = sourceMap;
            return map.TryGetValue(source, out var mapped) ? (mapped.Local ?? source, mapped.Blocked) : (source, false);
        }

        #endregion

        #region State

        async Task SetCurrent(string? entryId, bool startTrack, bool load = false, double startAt = 0)
        {
            var changed = entryId != current;
            current = entryId;

            if (entryId == null)
            {
                anchor = new PlaybackAnchor { Seq = anchor.Seq + 1, PlayId = ++playIdCounter, Rate = LtProtocol.EffectiveRate(speed) };
                sync.Reset();
                BroadcastAnchor();
                return;
            }

            if (!changed && !startTrack) return;

            var entry = entries.GetValueOrDefault(entryId);
            trackStartedAt = MonoClock.NowMs;
            anchor = new PlaybackAnchor
            {
                EntryId = entryId,
                PlayId = ++playIdCounter,
                Position = Math.Max(0, startAt),
                HostTimeMs = MonoClock.NowMs,
                Rate = LtProtocol.EffectiveRate(speed),
                Playing = playing,
                Pending = playing,
                Duration = entry?.Duration ?? 0,
                Seq = anchor.Seq + 1,
            };
            pendingSince = MonoClock.NowMs;

            RebuildSourceMap();
            var blocked = IsBlocked(entryId);
            if (blocked)
            {
                // Nothing will start here to tell us when: begin the timeline now.
                anchor.Pending = false;
            }

            BroadcastAnchor();
            await sync.SetTarget(anchor, LocalSource(entryId), blocked, load);
        }

        async Task SetPlaying(bool value)
        {
            if (value == playing) return;
            playing = value;
            if (current == null) return;

            var now = MonoClock.NowMs;
            if (value && !IsBlocked(current))
            {
                // Resuming: the timeline restarts when the engine here really does, so its start-up
                // latency isn't everyone's error.
                if (!anchor.Pending && anchor.PositionAt(now) < 0.5 && now - trackStartedAt < 5000) anchor.Position = 0;
                else if (!anchor.Pending) anchor.Position = anchor.PositionAt(now);
                anchor.Pending = true;
                anchor.Playing = true;
                anchor.HostTimeMs = now;
                pendingSince = now;
                anchor.Seq++;
            }
            else Reanchor(value);

            BroadcastAnchor();
            await sync.SetTarget(anchor, LocalSource(current), IsBlocked(current), load: false);
        }

        void Reanchor(bool isPlaying, double? rate = null)
        {
            var now = MonoClock.NowMs;
            var position = anchor.PositionAt(now);
            anchor.Position = position;
            anchor.HostTimeMs = now;
            anchor.Playing = isPlaying;
            if (rate != null) anchor.Rate = rate.Value;
            if (!isPlaying) anchor.Pending = false;
            anchor.Seq++;
        }

        string? lastPublishedSignature;

        /// <summary>Publishes a new version if anything shared changed.</summary>
        async Task Commit(bool writeStore, bool force = false)
        {
            var signature = string.Join(",", order) + "|" + string.Join(",", shuffle ? originalOrder : new List<string>()) +
                $"|{current}|{playing}|{loop}|{shuffle}|{station?.Value<string>("id")}|{fxVersion}";

            if (signature == lastPublishedSignature && !force && !writeStore) return;
            var changed = signature != lastPublishedSignature || force;
            lastPublishedSignature = signature;

            if (changed)
            {
                version++;
                orderHistory[version] = new HashSet<string>(order);
                foreach (var old in orderHistory.Keys.Where((v) => v < version - 64).ToList()) orderHistory.Remove(old);

                // Forget entries nobody can reach any more.
                var live = new HashSet<string>(order.Concat(originalOrder));
                foreach (var stale in entries.Keys.Where((id) => !live.Contains(id)).ToList())
                {
                    entries.Remove(stale);
                    hostSongs.Remove(stale);
                }
                RebuildSourceMap();
            }

            if (writeStore) await WriteHostStore();
            if (changed) BroadcastState();
            PublishStatus();
        }

        async Task WriteHostStore()
        {
            var currentSongs = order.Select(HostSongFor).ToList();
            var originalSongs = (shuffle ? originalOrder : order).Select(HostSongFor).ToList();
            var index = current != null ? Math.Max(0, order.IndexOf(current)) : 0;

            await app.WriteStore(new LtStoreWrite
            {
                Current = currentSongs,
                Original = originalSongs,
                Index = index,
                Playing = playing && current != null,
                Loop = loop,
                Shuffle = shuffle,
                Station = station,
                RadioId = radioId,
                Stamp = version,
                SessionId = SessionId,
            });

            tracker.RecordWrite(version, new LtStoreView
            {
                Current = currentSongs,
                Original = originalSongs,
                Index = index,
                Playing = playing && current != null,
                Loop = loop,
                Shuffle = shuffle,
                Station = station,
                RadioId = radioId,
                Stamp = version,
                StampSession = SessionId,
            }, order.ToList());
        }

        JObject HostSongFor(string entryId)
        {
            JObject song;
            if (hostSongs.TryGetValue(entryId, out var own))
            {
                song = (JObject)own.DeepClone();
                song[LtSongs.EntryIdKey] = entryId;
            }
            else if (entries.TryGetValue(entryId, out var entry))
            {
                song = LtSongs.ForLocalStore(entry, availability.Get(entry).PlaybackId);
            }
            else
            {
                song = new JObject { ["id"] = entryId, ["title"] = "Unknown", [LtSongs.EntryIdKey] = entryId };
            }
            return song;
        }

        string? LocalSource(string entryId)
        {
            if (hostSongs.TryGetValue(entryId, out var song)) return LtSongs.PlaybackIdOf(song);
            if (entries.TryGetValue(entryId, out var entry)) return availability.Get(entry).PlaybackId ?? entry.CatalogId ?? entry.SongId;
            return null;
        }

        bool IsBlocked(string? entryId)
        {
            if (entryId == null || !entries.TryGetValue(entryId, out var entry)) return false;
            return availability.Get(entry).Status == Availability.Status.Unavailable;
        }

        void RebuildSourceMap()
        {
            var map = new Dictionary<string, (string? Local, bool Blocked)>();
            foreach (var id in order)
            {
                if (!entries.TryGetValue(id, out var entry)) continue;
                var storeSource = hostSongs.TryGetValue(id, out var song) ? LtSongs.PlaybackIdOf(song) : entry.CatalogId ?? entry.SongId;
                var result = availability.Get(entry);
                var blocked = IsBlocked(id);
                var local = entry.AddedBy == ParticipantId ? storeSource : result.PlaybackId ?? storeSource;
                if (local != storeSource || blocked) map[storeSource] = (local, blocked);
            }
            sourceMap = map;
        }

        async Task RefreshAvailability()
        {
            try
            {
                List<QueueEntry> snapshot = await exec.Run(() => Task.FromResult(entries.Values.ToList()));
                if (await availability.Refresh(snapshot))
                {
                    exec.Post(async () =>
                    {
                        RebuildSourceMap();
                        if (current != null) await sync.SetTarget(anchor, LocalSource(current), IsBlocked(current), load: IsBlocked(current) != sync.Blocked);
                        await WriteHostStore();
                        BroadcastUnavailable();
                        PublishStatus();
                    });
                }
            }
            catch (Exception ex)
            {
                LtLog.Warn("Availability check failed: " + ex.Message);
            }
        }

        #endregion

        #region Broadcasting

        JObject StateFor(Participant participant)
        {
            var newBodies = new JObject();
            foreach (var id in order.Concat(originalOrder))
            {
                if (participant.SentEntries.Contains(id) || !entries.TryGetValue(id, out var entry)) continue;
                if (newBodies.ContainsKey(id)) continue;
                newBodies[id] = entry.ToJson();
            }

            return new JObject
            {
                ["t"] = "state",
                ["v"] = version,
                ["sid"] = SessionId,
                ["order"] = new JArray(order),
                ["orig"] = shuffle ? new JArray(originalOrder) : null,
                ["cur"] = current,
                ["playing"] = playing,
                ["loop"] = loop,
                ["shuffle"] = shuffle,
                ["station"] = station,
                ["radio"] = !string.IsNullOrEmpty(radioId),
                ["fx"] = new JObject { ["speed"] = speed, ["filter"] = filterData, ["v"] = fxVersion },
                ["tracks"] = newBodies,
            };
        }

        void SendState(Participant participant)
        {
            if (!participant.Connected) return;
            var state = StateFor(participant);
            foreach (var property in ((JObject)state["tracks"]!).Properties()) participant.SentEntries.Add(property.Name);
            participant.LastSentVersion = version;
            participant.Link!.Send(state);
        }

        void BroadcastState()
        {
            foreach (var participant in participants.Values) SendState(participant);
        }

        void BroadcastAnchor()
        {
            lastAnchorBroadcast = MonoClock.NowMs;
            Broadcast(LtProtocol.Anchor(anchor));
            // The host's own engine follows the same timeline.
            if (current != null) _ = sync.SetTarget(anchor, LocalSource(current), IsBlocked(current), load: false);
        }

        void Broadcast(JObject message, Participant? except = null)
        {
            var json = message.ToString(Newtonsoft.Json.Formatting.None);
            foreach (var participant in participants.Values)
            {
                if (participant == except || !participant.Connected) continue;
                participant.Link!.Send(json);
            }
        }

        JArray PeersJson(string? you = null)
        {
            var list = new JArray
            {
                new JObject
                {
                    ["id"] = ParticipantId,
                    ["name"] = Name,
                    ["host"] = true,
                    ["you"] = you == ParticipantId,
                    ["state"] = "connected",
                    ["sync"] = sync.State,
                    ["drift"] = sync.DriftMs,
                    ["sf"] = app.Storefront,
                    ["platform"] = app.Platform,
                },
            };
            foreach (var participant in participants.Values) list.Add(participant.ToJson(participant.Id == you));
            return list;
        }

        void BroadcastPeers()
        {
            lastPeersBroadcast = MonoClock.NowMs;
            foreach (var participant in participants.Values)
            {
                participant.Link?.Send(new JObject { ["t"] = "peers", ["list"] = PeersJson(participant.Id) });
            }
        }

        JObject UnavailableMap()
        {
            var map = new JObject();
            foreach (var id in order)
            {
                if (!entries.TryGetValue(id, out var entry)) continue;
                var who = participants.Values.Where((p) => p.Unavailable.Contains(id)).Select((p) => p.Id).ToList();
                if (availability.Get(entry).Status == Availability.Status.Unavailable) who.Add(ParticipantId);
                if (who.Count > 0) map[id] = new JArray(who);
            }
            return map;
        }

        void SendUnavailable(Participant participant) =>
            participant.Link?.Send(new JObject { ["t"] = "unavail", ["map"] = UnavailableMap() });

        void BroadcastUnavailable() => Broadcast(new JObject { ["t"] = "unavail", ["map"] = UnavailableMap() });

        bool UnplayableForEveryone(string entryId)
        {
            if (!IsBlocked(entryId)) return false;
            var connected = participants.Values.Where((p) => p.Connected).ToList();
            return connected.All((p) => p.Unavailable.Contains(entryId));
        }

        #endregion

        #region Tick

        async Task Tick()
        {
            if (ended) return;
            var now = MonoClock.NowMs;
            sync.Tick();

            if (current != null && playing)
            {
                // The host's engine never started (stuck loading): don't hold everyone hostage.
                if (anchor.Pending && now - pendingSince > 8000)
                {
                    LtLog.Warn("The track didn't start here in time; starting the session clock anyway");
                    anchor.Pending = false;
                    anchor.Position = Math.Max(0, app.EngineSource == LocalSource(current) ? app.EnginePosition : 0);
                    anchor.HostTimeMs = now;
                    anchor.Seq++;
                    BroadcastAnchor();
                    await sync.SetTarget(anchor, LocalSource(current), IsBlocked(current), load: false);
                }

                if (!anchor.Pending && anchor.Duration > 0 && advancedForPlayId != anchor.PlayId)
                {
                    var position = anchor.PositionAt(now);
                    // A track playing elsewhere but silent here ends on the clock; one stuck here
                    // (buffering forever) ends on the clock a little later.
                    var limit = sync.Blocked ? anchor.Duration : anchor.Duration + 4;
                    if (position >= limit)
                    {
                        advancedForPlayId = anchor.PlayId;
                        LtLog.Info(sync.Blocked ? "Track over (not playable here)" : "Track should be over; moving on");
                        await app.HostAdvance();
                        await OnLocalStoreChanged();
                    }
                }

                if (skippedForPlayId != anchor.PlayId && UnplayableForEveryone(current) && now - trackStartedAt > 1500)
                {
                    skippedForPlayId = anchor.PlayId;
                    var title = LtText.Title(entries.GetValueOrDefault(current));
                    LtLog.Info($"Skipping \"{title}\": nobody can play it");
                    app.Notify("info", $"Skipped \"{title}\": it isn't available to anyone in the session.");
                    Broadcast(new JObject { ["t"] = "notice", ["text"] = $"Skipped \"{title}\": it isn't available to anyone in the session." });
                    advancedForPlayId = anchor.PlayId;
                    await app.HostAdvance();
                    await OnLocalStoreChanged();
                }
            }

            if (now - lastAnchorBroadcast > 2000) BroadcastAnchor();

            foreach (var participant in participants.Values.ToList())
            {
                if (participant.Connected && now - participant.Link!.LastReceivedAt > 15_000)
                {
                    participant.Link.Close("timed out");
                }
                else if (!participant.Connected && participant.DisconnectedAt > 0 && now - participant.DisconnectedAt > 120_000)
                {
                    participants.Remove(participant.Id);
                    LtLog.Info($"{participant.Name} didn't come back");
                    app.Notify("info", $"{participant.Name} left");
                    BroadcastPeers();
                    BroadcastUnavailable();
                }
                else if (!participant.EverConnected && now - participant.JoinedAt > 60_000)
                {
                    participants.Remove(participant.Id);
                }
            }

            if (now - lastPeersBroadcast > 3000) BroadcastPeers();
            if (now - lastStatusPublish > 1000) PublishStatus();
        }

        #endregion

        #region Status

        public void PublishStatus()
        {
            lastStatusPublish = MonoClock.NowMs;
            var addedBy = new JObject();
            foreach (var id in order)
            {
                if (entries.TryGetValue(id, out var entry) && entry.AddedBy != ParticipantId) addedBy[id] = entry.AddedBy;
            }

            app.PublishStatus(new JObject
            {
                ["active"] = !ended,
                ["role"] = "host",
                ["phase"] = phase,
                ["error"] = error,
                ["code"] = JoinCode.Format(Code),
                ["you"] = ParticipantId,
                ["name"] = Name,
                ["participants"] = PeersJson(ParticipantId),
                ["sync"] = new JObject { ["state"] = sync.State, ["drift"] = sync.DriftMs, ["corrections"] = sync.Corrections },
                ["current"] = new JObject
                {
                    ["entry"] = current,
                    ["blocked"] = current != null && IsBlocked(current),
                    ["title"] = current != null ? LtText.Title(entries.GetValueOrDefault(current)) : null,
                },
                ["addedBy"] = addedBy,
                ["unavailable"] = UnavailableMap(),
            });
        }

        public string DisplayName => Name;

        public Task Rename(string name) => exec.Run(async () =>
        {
            Name = LtText.CleanName(name, Name);
            BroadcastPeers();
            PublishStatus();
        });

        public void SetUserOffset(double seconds) => exec.Post(() => { sync.UserOffsetSec = seconds; });

        #endregion
    }
}
