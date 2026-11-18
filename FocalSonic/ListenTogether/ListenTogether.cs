using FocalSonic.ListenTogether.Core;
using FocalSonic.ListenTogether.Session;
using IgniteView.Core;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace FocalSonic.ListenTogether
{
    /// <summary>
    /// Listen Together: listening sessions between FocalSonic users over the internet. Only
    /// playback commands and queue state travel between peers; everyone plays the audio from
    /// their own Apple Music account. Everything runs here in C#, so a session carries on with
    /// the window closed.
    ///
    /// This class is the app's entry point: commands for the UI, and hooks the player store,
    /// the audio engines and the effects call into.
    /// </summary>
    public static class ListenTogether
    {
        static readonly SemaphoreSlim Gate = new(1, 1);
        static ILtSession? session;
        static AppBridge? bridge;
        static string lastStatus = IdleStatus().ToString(Formatting.None);

        internal static AppBridge Bridge => bridge ??= new AppBridge();

        static ILtSession? Active => session is { } s && s.IsActive ? s : null;

        public static bool InSession => Active != null;
        public static bool IsGuest => Active?.Role == "guest";

        static JObject IdleStatus() => new() { ["active"] = false, ["phase"] = "idle" };

        public static void Setup()
        {
            AppDomain.CurrentDomain.ProcessExit += (_, _) => Shutdown();
            // A guest's own effects are swapped out for the session's; if the app died mid-session,
            // put them back now.
            _ = Task.Run(() => Bridge.RestoreEffectsBackupIfAny());
        }

        #region Commands

        [Command("listenTogetherHost")]
        public static async Task<string> HostSession(string name)
        {
            await Gate.WaitAsync();
            try
            {
                if (Active != null) return Result(false, "You're already in a session.");
                if (!AppBridge.IsAppleMusicSignedIn) return Result(false, "Sign in to Apple Music to host a session.");

                Bridge.SaveDisplayName(name);
                var host = new HostSession(Bridge, name);
                session = host;

                try
                {
                    await host.Start(CancellationToken.None);
                    return Result(true);
                }
                catch (Exception ex)
                {
                    LtLog.Error("Couldn't start hosting: " + ex);
                    session = null;
                    return Result(false, ex is Transport.SignalingException ? "Couldn't reach the Listen Together server. Check your internet connection and try again." : "Couldn't start the session.");
                }
            }
            finally
            {
                Gate.Release();
            }
        }

        [Command("listenTogetherJoin")]
        public static async Task<string> JoinSession(string code, string name)
        {
            await Gate.WaitAsync();
            try
            {
                if (Active != null) return Result(false, "Leave your current session first.");
                if (!AppBridge.IsAppleMusicSignedIn) return Result(false, "Sign in to Apple Music to join a session.");

                switch (JoinCode.TryParse(code, out var parsed))
                {
                    case JoinCode.ParseResult.Empty: return Result(false, "Enter the code the host shared with you.");
                    case JoinCode.ParseResult.WrongLength: return Result(false, $"Session codes are {JoinCode.Length} characters long.");
                    case JoinCode.ParseResult.InvalidCharacters: return Result(false, "That doesn't look like a session code.");
                    case JoinCode.ParseResult.Mistyped: return Result(false, "That code looks mistyped. Check it and try again.");
                }

                Bridge.SaveDisplayName(name);
                var guest = new GuestSession(Bridge, parsed, name);
                session = guest;

                try
                {
                    await guest.Start(CancellationToken.None);
                    return Result(true);
                }
                catch (Exception ex)
                {
                    LtLog.Warn("Couldn't join: " + ex.Message);
                    session = null;
                    return Result(false, ex is LtJoinException or Transport.SignalingException
                        ? (ex is Transport.SignalingException ? "Couldn't reach the Listen Together server. Check your internet connection and try again." : ex.Message)
                        : "Couldn't join the session.");
                }
            }
            finally
            {
                Gate.Release();
            }
        }

        [Command("listenTogetherLeave")]
        public static async Task LeaveSession()
        {
            await Gate.WaitAsync();
            try
            {
                var current = session;
                session = null;
                if (current != null) await current.Stop(current.Role == "host" ? "The host ended the session." : "left");
                Bridge.SessionEnded();
                PublishStatus(IdleStatus());
            }
            finally
            {
                Gate.Release();
            }
        }

        [Command("getListenTogetherStatus")]
        public static string GetStatus() => lastStatus;

        [Command("getListenTogetherDisplayName")]
        public static string GetDisplayName() => Bridge.LoadDisplayName();

        [Command("setListenTogetherSyncOffset")]
        public static void SetSyncOffset(double milliseconds) =>
            Active?.SetUserOffset(Math.Clamp(milliseconds, -1000, 5000) / 1000.0);

        [Command("getListenTogetherLog")]
        public static string GetLog() => LtLog.Dump();

        static string Result(bool ok, string? error = null) =>
            new JObject { ["ok"] = ok, ["error"] = error, ["status"] = JObject.Parse(lastStatus) }.ToString(Formatting.None);

        internal static void PublishStatus(JObject status)
        {
            // A session that ended on its own (the host left, the connection died) is cleared here.
            if (status.Value<bool?>("active") == false && session != null && !session.IsActive)
            {
                session = null;
                Bridge.SessionEnded();
            }

            lastStatus = status.ToString(Formatting.None);
            Program.MainWindow?.CallFunction("window.listenTogetherStatusChanged", lastStatus);
        }

        /// <summary>Ends the session as the app quits, so guests hear about it straight away.</summary>
        public static void Shutdown()
        {
            var current = session;
            session = null;
            current?.Abort();
        }

        #endregion

        #region Hooks

        /// <summary>The player store was written (by the UI or by C#). <paramref name="full"/>: the queue may have changed.</summary>
        public static void StoreChanged(bool full)
        {
            var current = Active;
            if (current == null || Bridge.IsWritingStore) return;
            if (!full && !Bridge.PlaybackStateChanged()) return;
            current.OnStoreChanged();
        }

        public static void EffectsChanged()
        {
            if (Bridge.IsWritingEffects) return;
            Active?.OnEffectsChanged();
        }

        /// <summary>A seek the user asked for (not one the session made).</summary>
        public static void UserSeek(double position) => Active?.OnLocalSeek(position);

        public static void TimeUpdate(bool playing, double position, double duration) => Active?.OnTimeUpdate(playing, position, duration);

        public static void Loaded() => Active?.OnLoaded();

        public static void TrackStarted() => Active?.OnTrackStarted();

        /// <summary>True when the session decides what happens after a track ends.</summary>
        public static bool EngineEnded() => Active?.OnEngineEnded() ?? false;

        /// <summary>True when next/previous is the session's to handle.</summary>
        public static bool UserSkip(bool next) => Active?.OnUserSkip(next) ?? false;

        /// <summary>True when the session handles a failed load itself (no error dialog, no pause).</summary>
        public static bool LoadFailed(string source) => Active?.OnLoadFailed(source) ?? false;

        public static (string Source, bool Blocked) ResolveSource(string source)
        {
            var current = Active;
            if (current == null || string.IsNullOrEmpty(source)) return (source, false);
            var (mapped, blocked) = current.ResolveSource(source);
            return (mapped ?? source, blocked);
        }

        #endregion
    }
}
