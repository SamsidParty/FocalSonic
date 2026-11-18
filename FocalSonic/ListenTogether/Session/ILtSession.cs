namespace FocalSonic.ListenTogether.Session
{
    /// <summary>What the app talks to while a session is running, whatever the role.</summary>
    public interface ILtSession
    {
        string Role { get; }
        string SessionId { get; }
        string ParticipantId { get; }
        string DisplayName { get; }
        bool IsActive { get; }

        Task Stop(string reason);
        /// <summary>The app is quitting: say goodbye to peers, touch nothing else.</summary>
        void Abort();

        void OnStoreChanged();
        void OnEffectsChanged();
        void OnLocalSeek(double position);
        void OnTimeUpdate(bool playing, double position, double duration);
        void OnLoaded();
        void OnTrackStarted();

        /// <summary>The engine finished the track. True if the session handles what happens next.</summary>
        bool OnEngineEnded();
        /// <summary>Next / previous from the UI or media keys. True if the session handles it.</summary>
        bool OnUserSkip(bool next);
        /// <summary>The engine couldn't play a source. True if the session handles it (no error dialog).</summary>
        bool OnLoadFailed(string source);

        /// <summary>What the engine should really play for a source, and whether it can't be played here at all.</summary>
        (string? Source, bool Blocked) ResolveSource(string source);

        void PublishStatus();
        Task Rename(string name);
        void SetUserOffset(double seconds);
    }
}
