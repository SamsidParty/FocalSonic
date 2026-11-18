using Newtonsoft.Json.Linq;

namespace FocalSonic.ListenTogether.Session
{
    /// <summary>
    /// Everything a session needs from the app: the player store, the audio engine and the
    /// effects. Implemented by <c>AppBridge</c> in the app, and by fakes in the simulator.
    /// </summary>
    public interface ILtApp
    {
        string Storefront { get; }
        string Platform { get; }
        string AppVersion { get; }

        /// <summary>GET against the Apple Music API (path relative to /v1/), null on failure.</summary>
        Task<JObject?> AppleMusicGet(string path);

        #region Player store

        LtStoreView ReadStore();
        /// <summary>Replaces the queue and playback state, in C# and in the UI.</summary>
        Task WriteStore(LtStoreWrite write);
        /// <summary>Removes the session's version stamp after leaving.</summary>
        Task ClearStamp();

        #endregion

        #region Effects

        (double Speed, string FilterData) ReadEffects();
        /// <summary>Saves and applies speed and effects (to the engine and the UI).</summary>
        Task WriteEffects(double speed, string filterData);
        bool HasImpulse(string impulseId);
        /// <summary>A guest takes on the session's effects: remember the user's own (durably, in case of a crash).</summary>
        Task BeginGuestEffects();
        /// <summary>Puts the user's own effects back.</summary>
        Task EndGuestEffects();

        #endregion

        #region Engine

        /// <summary>The source the engine was last asked to play (null if none).</summary>
        string? EngineSource { get; }
        /// <summary>The engine has loaded <see cref="EngineSource"/>.</summary>
        bool EngineLoaded { get; }
        /// <summary>The engine's last reported position, in seconds.</summary>
        double EnginePosition { get; }
        /// <summary>Loads a track, replacing the current one.</summary>
        Task Load(string playbackId, bool play);
        Task Play();
        Task Pause();
        Task Seek(double seconds);
        /// <summary>Stops the engine for a track this participant can't play.</summary>
        Task Silence();
        /// <summary>Drives the UI's progress bar for a track that is playing elsewhere but not here.</summary>
        void ShowVirtualProgress(double position, double duration, bool playing);

        #endregion

        #region Host queue actions (the app's own logic: loop modes, radio, ...)

        Task HostAdvance();
        Task HostNext();
        Task HostPrevious();
        Task HostSetPlaying(bool playing);
        /// <summary>Shuffles or unshuffles the queue the way the UI would.</summary>
        Task HostSetShuffle(bool shuffle);

        #endregion

        void PublishStatus(JObject status);
        void Notify(string level, string message);
    }
}
