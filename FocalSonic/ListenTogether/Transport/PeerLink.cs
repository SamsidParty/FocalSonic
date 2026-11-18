using FocalSonic.ListenTogether.Core;
using Newtonsoft.Json.Linq;
using SIPSorcery.Net;
using System.Buffers.Binary;
using System.IO.Compression;
using System.Text;

namespace FocalSonic.ListenTogether.Transport
{
    public enum PeerLinkState { Connecting, Open, Closed }

    /// <summary>
    /// One WebRTC data channel to one peer (SIPSorcery: pure .NET, no native libraries, so the
    /// same on every platform). Carries JSON messages of any size: big ones are deflated and
    /// split into chunks, since SCTP messages are capped and a full queue can be large.
    /// </summary>
    public sealed class PeerLink : IDisposable
    {
        const string ChannelLabel = "focalsonic-lt";
        const int CompressThreshold = 4 * 1024;
        const int MaxFrame = 48 * 1024;
        const int MaxMessage = 32 * 1024 * 1024;

        readonly RTCPeerConnection pc;
        RTCDataChannel? channel;
        readonly object sendGate = new();
        readonly List<RTCIceCandidate> localCandidates = new();
        readonly Dictionary<uint, (byte[][] Parts, int Received, double StartedAt)> partial = new();
        uint nextMessageId;
        Timer? disconnectTimer;

        public string Id { get; } = LtIds.New(6);
        public IceProfile Profile { get; }
        public PeerLinkState State { get; private set; } = PeerLinkState.Connecting;
        public double LastReceivedAt { get; private set; } = MonoClock.NowMs;
        public string? CloseReason { get; private set; }

        /// <summary>"direct", "relay" or null while unknown.</summary>
        public string? Route { get; private set; }

        public event Action<JObject>? MessageReceived;
        public event Action<PeerLink>? Opened;
        /// <summary>A candidate found after the offer/answer went out (a slow relay allocation), to be passed on through signaling.</summary>
        public event Action<JObject>? LateCandidate;
        bool described;

        #region Network impairment for the simulator (environment variables; off otherwise)

        static readonly (double Min, double Max)? TestDelay = ParseRange(Environment.GetEnvironmentVariable("FOCALSONIC_LT_TEST_DELAY_MS"));
        /// <summary>Until this time every frame in or out is dropped, like a dead network.</summary>
        public static double TestBlackholeUntil;
        System.Threading.Channels.Channel<(double At, JObject Message)>? testQueue;

        // Messages that arrive before the session has hooked this link up (the peer can start
        // talking the moment the channel opens) wait here instead of being lost.
        bool holding = true;
        readonly List<JObject> held = new();

        static (double, double)? ParseRange(string? value)
        {
            var parts = value?.Split(',');
            if (parts?.Length != 2 || !double.TryParse(parts[0], out var min) || !double.TryParse(parts[1], out var max)) return null;
            return (min, max);
        }

        #endregion
        public event Action<PeerLink, string>? Closed;

        readonly bool expectRelay;

        PeerLink(RTCConfiguration config, IceProfile profile)
        {
            Profile = profile;
            expectRelay = config.iceServers?.Any((s) => s.urls?.StartsWith("turn") == true) == true;
            pc = new RTCPeerConnection(config);

            pc.onicecandidate += (candidate) =>
            {
                if (candidate == null) return;
                bool late;
                lock (localCandidates)
                {
                    late = described;
                    if (!late) localCandidates.Add(candidate);
                }
                if (late)
                {
                    LtLog.Info($"Link {Id}: late {candidate.type} candidate");
                    LateCandidate?.Invoke(new JObject { ["c"] = candidate.candidate, ["m"] = candidate.sdpMid ?? "0", ["i"] = candidate.sdpMLineIndex });
                }
            };

            pc.onconnectionstatechange += (state) =>
            {
                LtLog.Info($"Link {Id}: connection {state}");

                if (state == RTCPeerConnectionState.connected)
                {
                    disconnectTimer?.Dispose();
                    disconnectTimer = null;
                    UpdateRoute();
                }
                else if (state == RTCPeerConnectionState.disconnected)
                {
                    // ICE consent checks can recover a briefly broken path (Wi-Fi roaming,
                    // a dropped packet burst), so give it a moment before tearing down.
                    disconnectTimer?.Dispose();
                    disconnectTimer = new Timer((_) => Close("connection lost"), null, 6000, Timeout.Infinite);
                }
                else if (state == RTCPeerConnectionState.failed)
                {
                    Close("connection failed");
                }
                else if (state == RTCPeerConnectionState.closed)
                {
                    Close("connection closed");
                }
            };
        }

        void UpdateRoute()
        {
            try
            {
                var entry = pc.GetRtpChannel()?.NominatedEntry;
                if (entry == null) return;
                var relayed = entry.LocalCandidate?.type == RTCIceCandidateType.relay || entry.RemoteCandidate?.type == RTCIceCandidateType.relay;
                Route = relayed ? "relay" : "direct";
                LtLog.Info($"Link {Id}: route {Route} ({entry.LocalCandidate?.type} -> {entry.RemoteCandidate?.type})");
            }
            catch { }
        }

        void Attach(RTCDataChannel dc)
        {
            channel = dc;

            dc.onopen += () =>
            {
                if (State != PeerLinkState.Connecting) return;
                State = PeerLinkState.Open;
                LastReceivedAt = MonoClock.NowMs;
                UpdateRoute();
                Opened?.Invoke(this);
            };
            dc.onclose += () => Close("channel closed");
            dc.onerror += (error) => LtLog.Warn($"Link {Id}: channel error {error}");
            dc.onmessage += (_, _, data) => OnFrame(data);

            // The answerer's channel arrives already open.
            if (dc.readyState == RTCDataChannelState.open && State == PeerLinkState.Connecting)
            {
                State = PeerLinkState.Open;
                LastReceivedAt = MonoClock.NowMs;
                UpdateRoute();
                Opened?.Invoke(this);
            }
        }

        /// <summary>
        /// Waits for candidates. SIPSorcery reports gathering complete before the TURN allocation
        /// answers, so with a relay configured, wait for the relay candidate itself (it's the one
        /// that matters when a direct path fails). Anything later is trickled (see LateCandidate).
        /// </summary>
        async Task WaitForGathering(int timeoutMs)
        {
            var deadline = MonoClock.NowMs + timeoutMs;
            while (MonoClock.NowMs < deadline)
            {
                bool hasRelay;
                lock (localCandidates) hasRelay = localCandidates.Any((c) => c.type == RTCIceCandidateType.relay);
                if (pc.iceGatheringState == RTCIceGatheringState.complete && (!expectRelay || hasRelay)) return;
                await Task.Delay(40);
            }
            LtLog.Info($"Link {Id}: still gathering after {timeoutMs} ms; sending what there is");
        }

        JArray CandidatesJson()
        {
            lock (localCandidates)
            {
                described = true;
                return new JArray(localCandidates.Select((c) => new JObject
                {
                    ["c"] = c.candidate,
                    ["m"] = c.sdpMid ?? "0",
                    ["i"] = c.sdpMLineIndex,
                }));
            }
        }

        public void AddRemoteCandidates(JArray? candidates)
        {
            foreach (var candidate in candidates?.OfType<JObject>() ?? Enumerable.Empty<JObject>())
            {
                try
                {
                    pc.addIceCandidate(new RTCIceCandidateInit
                    {
                        candidate = candidate.Value<string>("c"),
                        sdpMid = candidate.Value<string>("m") ?? "0",
                        sdpMLineIndex = (ushort)(candidate.Value<int?>("i") ?? 0),
                    });
                }
                catch (Exception ex)
                {
                    LtLog.Warn($"Link {Id}: ignored a remote candidate: {ex.Message}");
                }
            }
        }

        /// <summary>
        /// The joining side. Candidates are gathered up front and sent along with the offer
        /// in one signaling message, since signaling is a polled mailbox and every extra
        /// round trip through it costs seconds.
        /// </summary>
        public static async Task<(PeerLink Link, JObject Offer)> CreateOffer(IceProfile profile, CancellationToken ct)
        {
            var link = new PeerLink(await IceConfig.Build(profile, ct), profile);
            var dc = await link.pc.createDataChannel(ChannelLabel, new RTCDataChannelInit { ordered = true });
            link.Attach(dc);

            var offer = link.pc.createOffer();
            await link.pc.setLocalDescription(offer);
            await link.WaitForGathering(profile == IceProfile.Tls ? 7000 : 5000);

            return (link, new JObject
            {
                ["sdp"] = link.pc.localDescription.sdp.ToString(),
                ["cands"] = link.CandidatesJson(),
                ["ice"] = (int)profile,
            });
        }

        public static async Task<(PeerLink Link, JObject Answer)> Accept(JObject offer, CancellationToken ct)
        {
            var profile = (IceProfile)(offer.Value<int?>("ice") ?? 0);
            var link = new PeerLink(await IceConfig.Build(profile, ct), profile);
            link.pc.ondatachannel += (dc) => link.Attach(dc);

            var result = link.pc.setRemoteDescription(new RTCSessionDescriptionInit { type = RTCSdpType.offer, sdp = offer.Value<string>("sdp") });
            if (result != SetDescriptionResultEnum.OK)
            {
                link.Dispose();
                throw new Exception("the connection offer was invalid: " + result);
            }

            link.AddRemoteCandidates(offer["cands"] as JArray);

            var answer = link.pc.createAnswer();
            await link.pc.setLocalDescription(answer);
            await link.WaitForGathering(profile == IceProfile.Tls ? 7000 : 5000);

            return (link, new JObject
            {
                ["sdp"] = link.pc.localDescription.sdp.ToString(),
                ["cands"] = link.CandidatesJson(),
            });
        }

        public void ApplyAnswer(JObject answer)
        {
            var result = pc.setRemoteDescription(new RTCSessionDescriptionInit { type = RTCSdpType.answer, sdp = answer.Value<string>("sdp") });
            if (result != SetDescriptionResultEnum.OK) throw new Exception("the host's answer was invalid: " + result);
            AddRemoteCandidates(answer["cands"] as JArray);
        }

        public async Task<bool> WaitOpen(TimeSpan timeout, CancellationToken ct)
        {
            var deadline = MonoClock.NowMs + timeout.TotalMilliseconds;
            while (State == PeerLinkState.Connecting && MonoClock.NowMs < deadline && !ct.IsCancellationRequested)
            {
                await Task.Delay(50, CancellationToken.None);
            }
            return State == PeerLinkState.Open;
        }

        #region Framing

        public void Send(JObject message) => Send(message.ToString(Newtonsoft.Json.Formatting.None));

        public void Send(string json)
        {
            if (State != PeerLinkState.Open || channel == null) return;
            if (MonoClock.NowMs < TestBlackholeUntil) return;

            byte[] frame;
            var utf8 = Encoding.UTF8.GetBytes(json);

            if (utf8.Length > CompressThreshold)
            {
                using var output = new MemoryStream();
                output.WriteByte(1);
                using (var deflate = new DeflateStream(output, CompressionLevel.Fastest, leaveOpen: true)) deflate.Write(utf8);
                frame = output.ToArray();
            }
            else
            {
                frame = new byte[utf8.Length + 1];
                utf8.CopyTo(frame, 1);
            }

            lock (sendGate)
            {
                try
                {
                    if (frame.Length <= MaxFrame)
                    {
                        channel.send(frame);
                        return;
                    }

                    var id = ++nextMessageId;
                    var payload = MaxFrame - 9;
                    var count = (frame.Length + payload - 1) / payload;
                    if (count > ushort.MaxValue) throw new Exception("message too large");

                    for (int i = 0; i < count; i++)
                    {
                        var length = Math.Min(payload, frame.Length - i * payload);
                        var chunk = new byte[9 + length];
                        chunk[0] = 2;
                        BinaryPrimitives.WriteUInt32BigEndian(chunk.AsSpan(1), id);
                        BinaryPrimitives.WriteUInt16BigEndian(chunk.AsSpan(5), (ushort)i);
                        BinaryPrimitives.WriteUInt16BigEndian(chunk.AsSpan(7), (ushort)count);
                        Array.Copy(frame, i * payload, chunk, 9, length);
                        channel.send(chunk);
                    }
                }
                catch (Exception ex)
                {
                    LtLog.Warn($"Link {Id}: send failed: {ex.Message}");
                }
            }
        }

        void OnFrame(byte[] data)
        {
            if (MonoClock.NowMs < TestBlackholeUntil) return;
            LastReceivedAt = MonoClock.NowMs;
            if (data.Length == 0) return;

            try
            {
                if (data[0] == 2)
                {
                    if (data.Length < 9) return;
                    var id = BinaryPrimitives.ReadUInt32BigEndian(data.AsSpan(1));
                    var index = BinaryPrimitives.ReadUInt16BigEndian(data.AsSpan(5));
                    var count = BinaryPrimitives.ReadUInt16BigEndian(data.AsSpan(7));
                    if (count == 0 || index >= count || (long)count * MaxFrame > MaxMessage) return;

                    byte[]? whole = null;
                    lock (partial)
                    {
                        // Drop reassemblies that will never finish (the link was replaced mid-send).
                        foreach (var stale in partial.Where((p) => MonoClock.NowMs - p.Value.StartedAt > 60_000).Select((p) => p.Key).ToList())
                        {
                            partial.Remove(stale);
                        }

                        if (!partial.TryGetValue(id, out var entry)) entry = (new byte[count][], 0, MonoClock.NowMs);
                        if (entry.Parts.Length != count) return;
                        if (entry.Parts[index] == null)
                        {
                            entry.Parts[index] = data.AsSpan(9).ToArray();
                            entry.Received++;
                        }

                        if (entry.Received == count)
                        {
                            partial.Remove(id);
                            whole = entry.Parts.SelectMany((p) => p).ToArray();
                        }
                        else
                        {
                            partial[id] = entry;
                        }
                    }

                    if (whole != null) Deliver(whole);
                    return;
                }

                Deliver(data);
            }
            catch (Exception ex)
            {
                LtLog.Warn($"Link {Id}: dropped a malformed frame: {ex.Message}");
            }
        }

        void Deliver(byte[] frame)
        {
            string json;
            if (frame[0] == 1)
            {
                using var input = new MemoryStream(frame, 1, frame.Length - 1);
                using var deflate = new DeflateStream(input, CompressionMode.Decompress);
                using var output = new MemoryStream();
                // Bounded, so a hostile peer can't decompress a bomb into memory.
                var buffer = new byte[64 * 1024];
                int read;
                while ((read = deflate.Read(buffer, 0, buffer.Length)) > 0)
                {
                    output.Write(buffer, 0, read);
                    if (output.Length > MaxMessage) throw new Exception("message too large");
                }
                json = Encoding.UTF8.GetString(output.GetBuffer(), 0, (int)output.Length);
            }
            else if (frame[0] == 0)
            {
                json = Encoding.UTF8.GetString(frame, 1, frame.Length - 1);
            }
            else
            {
                return;
            }

            JObject message;
            try { message = JObject.Parse(json); }
            catch { LtLog.Warn($"Link {Id}: dropped a message that isn't JSON"); return; }

            if (TestDelay is { } delay)
            {
                // In order, each message held back by a random latency (jitter queues up behind
                // slow messages, as on a real congested link).
                if (testQueue == null)
                {
                    testQueue = System.Threading.Channels.Channel.CreateUnbounded<(double, JObject)>();
                    var reader = testQueue.Reader;
                    _ = Task.Run(async () =>
                    {
                        await foreach (var (at, queued) in reader.ReadAllAsync())
                        {
                            var wait = at - MonoClock.NowMs;
                            if (wait > 0) await Task.Delay(TimeSpan.FromMilliseconds(wait));
                            Dispatch(queued);
                        }
                    });
                }
                testQueue.Writer.TryWrite((MonoClock.NowMs + delay.Min + Random.Shared.NextDouble() * (delay.Max - delay.Min), message));
                return;
            }

            Dispatch(message);
        }

        void Dispatch(JObject message)
        {
            lock (held)
            {
                if (holding)
                {
                    if (held.Count < 10_000) held.Add(message);
                    return;
                }
            }
            MessageReceived?.Invoke(message);
        }

        /// <summary>Starts delivering messages, including any that arrived before this.</summary>
        public void Release()
        {
            List<JObject> backlog;
            lock (held)
            {
                if (!holding) return;
                backlog = held.ToList();
                held.Clear();
                // Deliver the backlog before anything new can overtake it.
                foreach (var message in backlog) MessageReceived?.Invoke(message);
                holding = false;
            }
        }

        #endregion

        public void Close(string reason)
        {
            lock (sendGate)
            {
                if (State == PeerLinkState.Closed) return;
                State = PeerLinkState.Closed;
                CloseReason = reason;
            }

            disconnectTimer?.Dispose();
            LtLog.Info($"Link {Id}: closed ({reason})");

            try { channel?.close(); } catch { }
            try { pc.close(); } catch { }

            Closed?.Invoke(this, reason);
        }

        public void Dispose() => Close("disposed");
    }
}
