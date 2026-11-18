using FocalSonic.ListenTogether.Core;

namespace FocalSonic.ListenTogether.Session
{
    /// <summary>
    /// Keeps the local audio engine on the session's timeline: loads the right track, plays
    /// or pauses with everyone else, and corrects drift by seeking.
    ///
    /// Drift is corrected by seeking rather than nudging the playback rate, because both
    /// engines tie pitch to rate (varispeed) and a rate nudge would be audible. A seek is a
    /// tiny skip, so it's only done when the error is clearly real: the position has to be
    /// advancing normally (not buffering), the median of several readings has to be off, and
    /// a seek's own latency is learned and compensated so one correction is usually enough.
    /// Repeated corrections back off, so a participant on a bad connection doesn't stutter.
    /// </summary>
    public class LocalSync
    {
        public const double ToleranceSec = 0.06;
        const double HardThresholdSec = 2.0;
        const double SettleMs = 1400;

        readonly ILtApp app;
        readonly Func<double> hostNow;
        readonly bool isHost;

        PlaybackAnchor? anchor;
        string? source;
        bool blocked;
        string? lastAnchorKey;

        // Observations
        double lastPosition = -1;
        double lastPositionAt;
        bool advancing;
        bool engineEnded;
        readonly List<double> drifts = new();

        // Correction state
        double seekLeadSec = 0.15;
        double settleUntil;
        bool measureNextAfterSeek;
        readonly List<double> correctionTimes = new();
        // How far corrections actually landed from the target: the engine's seek precision.
        readonly List<double> residuals = new();
        double lastDebugAt;

        // Cue-and-fire: for big corrections, pause, seek ahead, and press play exactly when the
        // timeline gets there. Its precision is the play latency (small, steady) rather than
        // the seek latency (large, erratic), at the cost of a moment's silence, so it's used
        // where there's a discontinuity anyway: joining, track starts, after a stall.
        bool cueing;
        bool cueFired;
        double cueTarget;
        double cueStartedAt;
        double cueFiredAt;
        double lastCueSeekAt;
        int cueTries;
        int cueId;
        bool measureNextAfterCue;
        double playLeadSec = 0.08;
        double lastLoadedAt = -100_000;
        string? loadedSource;
        double cooldownUntil;
        double lastPlayPauseAt;
        int pausedAlignedSeq = -1;

        /// <summary>The engine has sat on a track for a long time without loading it (the web player fails silently).</summary>
        public event Action<string>? LoadStalled;
        double notLoadingSince;
        string? stallReportedFor;

        /// <summary>Extra delay, e.g. for AirPlay or Bluetooth speakers (positive = play later).</summary>
        public double UserOffsetSec { get; set; }

        public double? DriftMs { get; private set; }
        public string State { get; private set; } = "waiting";
        public int Corrections { get; private set; }

        public LocalSync(ILtApp app, Func<double> hostNow, bool isHost)
        {
            this.app = app;
            this.hostNow = hostNow;
            this.isHost = isHost;
        }

        public PlaybackAnchor? Anchor => anchor;
        public bool Blocked => blocked;

        /// <summary>
        /// The session's playback changed. <paramref name="load"/> makes this load the track
        /// (the change came from elsewhere); otherwise whoever changed it here already did.
        /// </summary>
        public async Task SetTarget(PlaybackAnchor next, string? playbackId, bool isBlocked, bool load)
        {
            var trackChanged = anchor == null || anchor.EntryId != next.EntryId || anchor.PlayId != next.PlayId || source != playbackId;
            var anchorKey = $"{next.EntryId}/{next.PlayId}/{next.Seq}";
            var wasBlocked = blocked;

            anchor = next.Clone();
            source = playbackId;
            blocked = isBlocked;

            if (trackChanged)
            {
                drifts.Clear();
                engineEnded = false;
                advancing = false;
                lastPosition = -1;
                measureNextAfterSeek = false;
                settleUntil = MonoClock.NowMs + SettleMs;
                pausedAlignedSeq = -1;
            }

            if (anchorKey != lastAnchorKey)
            {
                // A new anchor (seek, pause, resume, speed): readings against the old one mean nothing.
                lastAnchorKey = anchorKey;
                drifts.Clear();
                if (cueing)
                {
                    cueing = false;
                    cueId++;
                    load = true; // Put the play state back to what the session wants.
                }
                settleUntil = Math.Max(settleUntil, MonoClock.NowMs + 400);
            }

            if (blocked)
            {
                if (!wasBlocked || trackChanged) await app.Silence();
                State = "unavailable";
                return;
            }

            if (playbackId == null) { State = "waiting"; return; }

            if (load && (wasBlocked || app.EngineSource != playbackId))
            {
                LtLog.Info($"Loading {playbackId} (play: {next.Playing})");
                await app.Load(playbackId, next.Playing);
                settleUntil = MonoClock.NowMs + SettleMs;
                lastPlayPauseAt = MonoClock.NowMs;
                return;
            }

            if (load) await EnforcePlayState(force: true);
        }

        public void OnEngineEnded() => engineEnded = true;

        public void OnLoaded()
        {
            lastLoadedAt = MonoClock.NowMs;
            loadedSource = source;
            settleUntil = Math.Max(settleUntil, MonoClock.NowMs + 600);
            advancing = false;
            lastPosition = -1;
        }

        /// <summary>A position report from the engine.</summary>
        public async Task OnTimeUpdate(bool playing, double position, double duration)
        {
            var now = MonoClock.NowMs;
            if (anchor == null || blocked || source == null) return;
            if (app.EngineSource != source || !app.EngineLoaded) { advancing = false; lastPosition = -1; return; }

            // Not every engine sends a load event; the first sign of this track playing counts as one.
            if (loadedSource != source)
            {
                loadedSource = source;
                if (now - lastLoadedAt > 3000)
                {
                    lastLoadedAt = now;
                    settleUntil = Math.Max(settleUntil, now + 600);
                }
            }

            if (duration > 0 && anchor.Duration <= 0) anchor.Duration = duration;

            // Advancing at roughly the expected rate means real playback, not a stall.
            if (playing && lastPosition >= 0)
            {
                var elapsed = (now - lastPositionAt) / 1000.0;
                var moved = position - lastPosition;
                var expectedMove = elapsed * Math.Max(anchor.Rate, 0.05);
                advancing = elapsed > 0.05 && moved > expectedMove * 0.6 && moved < expectedMove * 1.6 + 0.3;
            }
            else
            {
                advancing = false;
            }

            lastPosition = position;
            lastPositionAt = now;

            await EnforcePlayState(force: false, enginePlaying: playing);

            if (!anchor.Playing)
            {
                DriftMs = null;
                State = "paused";
                // Line up while paused so resuming starts in sync.
                if (!playing && pausedAlignedSeq != anchor.Seq && Math.Abs(position - anchor.Position) > 0.35 && now > settleUntil)
                {
                    pausedAlignedSeq = anchor.Seq;
                    await app.Seek(anchor.Position);
                    settleUntil = now + 600;
                }
                return;
            }

            if (anchor.Pending) { State = "starting"; DriftMs = null; return; }

            var expected = anchor.PositionAt(hostNow()) - UserOffsetSec;
            var drift = position - expected;
            DriftMs = drift * 1000;

            if (cueing)
            {
                await HandleCue(playing, position, expected);
                return;
            }

            if (!playing || !advancing)
            {
                State = engineEnded ? "waiting" : "buffering";
                if (LtLog.DebugEnabled && now - lastDebugAt > 2000)
                {
                    lastDebugAt = now;
                    LtLog.Debug($"sync: not advancing (playing {playing}, pos {position:F2}, expected {expected:F2})");
                }
                return;
            }

            if (now < settleUntil)
            {
                State = "syncing";
                return;
            }

            if (measureNextAfterCue)
            {
                measureNextAfterCue = false;
                if (Math.Abs(drift) < 1.0) playLeadSec = Math.Clamp(playLeadSec - drift / anchor.Rate * 0.6, 0, 0.8);
                LtLog.Debug($"cue landed {drift * 1000:F0} ms off; play lead now {playLeadSec * 1000:F0} ms");
            }

            if (measureNextAfterSeek)
            {
                // How far off the last correction landed: the seek's own latency, learned.
                measureNextAfterSeek = false;
                if (Math.Abs(drift) < 1.0)
                {
                    seekLeadSec = Math.Clamp(seekLeadSec - drift * 0.6, -0.3, 1.5);
                    residuals.Add(drift);
                    while (residuals.Count > 6) residuals.RemoveAt(0);
                }
            }

            // Don't chase an error smaller than this engine can reliably seek to: each try
            // would be another audible skip for nothing.
            // (Holding still is precise, so being ahead always gets the tight tolerance.)
            var tolerance = ToleranceSec;
            var seekPrecise = false;
            if (residuals.Count >= 3)
            {
                // The lead takes care of the average error; what's left is jitter.
                var mean = residuals.Average();
                var spread = Math.Sqrt(residuals.Sum((r) => (r - mean) * (r - mean)) / (residuals.Count - 1));
                seekPrecise = spread < 0.05;
                if (residuals.Count >= 4) tolerance = Math.Clamp(spread * 1.5, ToleranceSec, 0.2);
            }

            if (LtLog.DebugEnabled && now - lastDebugAt > 2000)
            {
                lastDebugAt = now;
                LtLog.Debug($"sync: pos {position:F2} expected {expected:F2} drift {drift * 1000:F0} ms, rate {anchor.Rate}, lead {seekLeadSec * 1000:F0} ms, tolerance {tolerance * 1000:F0} ms, seq {anchor.Seq}");
            }

            drifts.Add(drift);
            while (drifts.Count > 4) drifts.RemoveAt(0);

            var ordered = drifts.OrderBy((d) => d).ToList();
            var median = ordered[ordered.Count / 2];
            var nearEnd = anchor.Duration > 0 && expected > anchor.Duration - 2.5;

            var needsCorrection =
                (Math.Abs(drift) > HardThresholdSec && drifts.Count >= 1) ||
                (drifts.Count >= 3 && median > ToleranceSec) ||
                (drifts.Count >= 3 && median < -tolerance) ||
                (drifts.Count >= 2 && Math.Abs(drift) > 0.5 && Math.Abs(drifts[^2]) > 0.5);

            if (!needsCorrection || nearEnd || expected < 0.3)
            {
                State = Math.Abs(median) <= Math.Max(tolerance, ToleranceSec) * 1.5 ? "synced" : "syncing";
                return;
            }

            // The back-off is for small errors we keep failing to fix; a big one (a missed seek, a
            // reconnect) is plainly real and gets fixed straight away.
            if (now < cooldownUntil && Math.Abs(drift) < 1.0)
            {
                State = "struggling";
                return;
            }

            correctionTimes.RemoveAll((t) => now - t > 30_000);
            correctionTimes.Add(now);
            if (correctionTimes.Count >= 5)
            {
                // Something keeps knocking us off (bad connection, slow seeks): back off.
                cooldownUntil = now + Math.Min(4_000 * (correctionTimes.Count - 3), 20_000);
            }

            // Ahead: hold still until the timeline catches up (precise, and nothing is heard twice).
            // Far behind: cue ahead. A little behind: a seek, which skips the least.
            var room = anchor.Duration <= 0 || expected + 4 * anchor.Rate < anchor.Duration;
            var justLoaded = now - lastLoadedAt < 8000;
            if (room && (drift > 0 || drift < -2.0 || (justLoaded && drift < (seekPrecise ? -0.5 : -0.15))))
            {
                await StartCue(expected, drift);
                return;
            }

            var target = expected + seekLeadSec * anchor.Rate;
            if (anchor.Duration > 0) target = Math.Min(target, anchor.Duration - 1);
            target = Math.Max(0, target);

            LtLog.Info($"Correcting drift of {drift * 1000:F0} ms (median {median * 1000:F0} ms): seek {position:F2} -> {target:F2} (lead {seekLeadSec * 1000:F0} ms)");
            Corrections++;
            State = "syncing";
            drifts.Clear();
            measureNextAfterSeek = true;
            settleUntil = now + SettleMs;
            await app.Seek(target);
        }

        async Task StartCue(double expected, double drift)
        {
            var now = MonoClock.NowMs;
            cueing = true;
            cueFired = false;
            cueTries = 0;
            cueStartedAt = now;
            cueId++;
            Corrections++;
            State = "syncing";
            drifts.Clear();

            if (drift > 0)
            {
                // Wait wherever the pause leaves us.
                cueTarget = double.NaN;
                LtLog.Info($"Holding: {drift * 1000:F0} ms ahead");
                await app.Pause();
                return;
            }

            // Far enough ahead to pause and seek before the timeline gets there.
            cueTarget = expected + (0.9 + Math.Max(0, seekLeadSec)) * anchor!.Rate;
            LtLog.Info($"Re-cueing: {drift * 1000:F0} ms off, waiting at {cueTarget:F2}");
            await app.Pause();
            await app.Seek(cueTarget);
            lastCueSeekAt = now;
        }

        async Task HandleCue(bool playing, double position, double expected)
        {
            var now = MonoClock.NowMs;
            State = "syncing";

            if (!cueFired)
            {
                if (now - cueStartedAt > 8000)
                {
                    LtLog.Warn("Re-cueing timed out; resuming");
                    cueing = false;
                    lastPlayPauseAt = now;
                    settleUntil = now + SettleMs;
                    await app.Play();
                    return;
                }

                // Wait for the engine to be paused at the target (a fade-out pause can carry it past).
                if (playing) return;
                if (double.IsNaN(cueTarget)) cueTarget = position;
                if (Math.Abs(position - cueTarget) > 0.15)
                {
                    if (now - lastCueSeekAt > 700) { lastCueSeekAt = now; await app.Seek(cueTarget); }
                    return;
                }

                var rate = Math.Max(anchor!.Rate, 0.05);
                var waitSec = (cueTarget - expected) / rate - playLeadSec;
                if (waitSec < 0.05)
                {
                    // The seek took longer than planned: aim further ahead.
                    if (++cueTries > 2)
                    {
                        cueing = false;
                        lastPlayPauseAt = now;
                        await app.Play();
                        return;
                    }
                    cueTarget = expected + (1.5 + cueTries) * rate;
                    lastCueSeekAt = now;
                    await app.Seek(cueTarget);
                    return;
                }

                cueFired = true;
                cueFiredAt = now + waitSec * 1000;
                var id = cueId;
                _ = Task.Run(async () =>
                {
                    var delay = cueFiredAt - MonoClock.NowMs;
                    if (delay > 0) await Task.Delay(TimeSpan.FromMilliseconds(delay));
                    if (cueing && cueId == id) await app.Play();
                });
                return;
            }

            if (now > cueFiredAt + 250 && playing)
            {
                cueing = false;
                lastPlayPauseAt = now;
                measureNextAfterCue = true;
                settleUntil = now + 500;
                drifts.Clear();
            }
            else if (now > cueFiredAt + 4000)
            {
                cueing = false;
                lastPlayPauseAt = now;
                await app.Play();
            }
        }

        async Task EnforcePlayState(bool force, bool? enginePlaying = null)
        {
            if (anchor == null || blocked || source == null || cueing) return;
            if (app.EngineSource != source) return;

            var now = MonoClock.NowMs;
            if (!force && now - lastPlayPauseAt < 2500) return;

            if (anchor.Playing)
            {
                // A track that finished here early waits for the session rather than replaying.
                if (engineEnded) return;
                var expected = anchor.PositionAt(hostNow());
                if (anchor.Duration > 0 && expected > anchor.Duration - 1) return;

                if (force || enginePlaying == false)
                {
                    lastPlayPauseAt = now;
                    await app.Play();
                }
            }
            else if (force || enginePlaying == true)
            {
                lastPlayPauseAt = now;
                await app.Pause();
            }
        }

        /// <summary>Called a few times a second: drives the progress bar for blocked tracks.</summary>
        public void Tick()
        {
            if (anchor == null) return;

            var now = MonoClock.NowMs;
            if (!blocked && source != null && anchor.Playing && app.EngineSource == source && !app.EngineLoaded)
            {
                if (notLoadingSince == 0) notLoadingSince = now;
                else if (now - notLoadingSince > 20_000 && stallReportedFor != source)
                {
                    stallReportedFor = source;
                    LtLog.Warn($"{source} hasn't loaded in 20 s; treating it as unplayable here");
                    LoadStalled?.Invoke(source);
                }
            }
            else
            {
                notLoadingSince = 0;
            }

            if (blocked)
            {
                var position = anchor.PositionAt(hostNow());
                app.ShowVirtualProgress(position, anchor.Duration, anchor.Playing && !anchor.Pending);
            }
        }

        public void Reset()
        {
            anchor = null;
            source = null;
            blocked = false;
            drifts.Clear();
            DriftMs = null;
            State = "waiting";
        }
    }
}
