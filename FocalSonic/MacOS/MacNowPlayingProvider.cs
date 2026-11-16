#if MACOS

using FocalSonic.Presence;

namespace FocalSonic.MacOS
{
    /// <summary>
    /// The macOS counterpart of WindowsPresenceProvider: shows the current track in Control
    /// Center and routes media keys, AirPods and Touch Bar controls back into FocalSonic's queue.
    /// FocalSonicHelper publishes it, for Apple Music too once it has switched off MusicKit's own
    /// entry (see MusicKitAudioPlayer.OwnsNowPlaying); if it can't, MusicKit's entry stays.
    /// </summary>
    public class MacNowPlayingProvider : PresenceProvider
    {
        string? LastWindowTitle;
        bool Published;

        public MacNowPlayingProvider()
        {
            MacHelper.RemoteCommand += OnRemoteCommand;
        }

        public override async Task Scrobble(MediaPlaybackInfo playbackInfo) { }

        public override async Task UpdateMediaStatus(MediaPlaybackInfo playbackInfo)
        {
            var song = playbackInfo.CurrentSong;
            var player = AudioPlayer.AudioPlayer.Instance;

            UpdateWindowTitle(song?.Title);

            // MusicKit publishes (and takes the controls for) Apple Music playback itself unless
            // the helper switched its entry off; a second entry would only compete with it.
            if (song == null || string.IsNullOrEmpty(song.Title) || player is MusicKitAudioPlayer { OwnsNowPlaying: false })
            {
                if (Published) MacHelper.RunningInstance?.Post("nowPlaying", new { active = false });
                Published = false;
                return;
            }

            Published = true;

            var artists = song.Artists?.Select((a) => a.Name).ToArray();
            MacHelper.Instance.Post("nowPlaying", new
            {
                active = true,
                title = song.Title,
                artist = artists?.Length > 0 ? string.Join(", ", artists) : song.Artist ?? "",
                album = song.Album ?? "",
                artwork = playbackInfo.Store?.ExtraProperties.GetCoverArtForSong(song.CoverArt!),
                duration = playbackInfo.Duration.TotalSeconds,
                position = playbackInfo.Position.TotalSeconds,
                rate = player?.Speed > 0 ? player.Speed : 1,
                playing = playbackInfo.IsPlaying,
                canNext = playbackInfo.NextSongIndex != null,
                canPrevious = playbackInfo.PreviousSongIndex != null,
            });
        }

        void UpdateWindowTitle(string? songTitle)
        {
            var windowTitle = string.IsNullOrEmpty(songTitle) ? null : songTitle + " | FocalSonic";
            if (Program.MainWindow != null && windowTitle != null && windowTitle != LastWindowTitle)
            {
                Program.MainWindow.Title = windowTitle;
                LastWindowTitle = windowTitle;
            }
        }

        static async void OnRemoteCommand(string command, double? time)
        {
            var info = MediaPlaybackInfo.Instance;
            if (info == null) return;

            try
            {
                switch (command)
                {
                    case "play": await info.Play(); break;
                    case "pause": await info.Pause(); break;
                    case "toggle": await (info.IsPlaying ? info.Pause() : info.Play()); break;
                    case "next": await info.NextSong(); break;
                    case "previous": await info.PreviousSong(); break;
                    case "seek" when time != null && AudioPlayer.AudioPlayer.Instance is { } player:
                        await AudioPlayer.AudioPlayer.RunOnPlayer(player.ID, (p) => { _ = p.SeekAudio(time.Value); });
                        break;
                }
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Media control '{command}' failed: {ex.Message}");
            }
        }
    }
}

#endif
