#if WINDOWS

using IgniteView.Core;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Windows.Media;
using Windows.Media.Control;
using Windows.Media.Playback;
using Windows.Storage.Streams;
using FocalSonic.AudioPlayer;
using FocalSonic.Presence;
using System.IO;
using FocalSonic.AppleMusic;

namespace FocalSonic.Windows
{
    public class WindowsPresenceProvider : PresenceProvider
    {
        public static MediaPlayer HostPlayer = new MediaPlayer();

        private string? LastMetadataHash;
        private string? LastWindowTitle;
        private bool HasRegisteredEvents = false;
        private RandomAccessStreamReference LastAlbumArt; // Prevents refreshing album art every time which wastes resources

        public override async Task Scrobble(MediaPlaybackInfo playbackInfo) { }

        public override async Task UpdateMediaStatus(MediaPlaybackInfo playbackInfo)
        {
            var song = playbackInfo.CurrentSong;
            SystemMediaTransportControls smtc = HostPlayer.SystemMediaTransportControls;
            var player = AudioPlayer.AudioPlayer.Instance;
            var playerSpeed = player?.Speed ?? 1.0f;
            var isAppleMusicPlayer = player is AppleMusicAudioPlayer;
            var artistNames = string.Join(", ", song?.Artists?.Select((a) => a.Name) ?? new string[] { song?.Artist ?? "" });
            var albumArtistNames = string.Join(", ", song?.AlbumArtists?.Select((a) => a.Name) ?? new string[] { song?.DisplayAlbumArtist ?? "" });
            var coverArt = playbackInfo.Store?.ExtraProperties.GetCoverArtForSong(song?.CoverArt!);
            var metadataHash = string.Join("|", new[]
            {
                song?.Id ?? "unknown",
                song?.Title ?? "Unknown Title",
                artistNames,
                song?.Album ?? "Unknown Album",
                albumArtistNames,
                coverArt ?? string.Empty,
                playerSpeed.ToString(),
                isAppleMusicPlayer ? "apple" : "default"
            });

            HostPlayer.CommandManager.IsEnabled = false;
            smtc.PlaybackStatus = playbackInfo.IsPlaying ? MediaPlaybackStatus.Playing : MediaPlaybackStatus.Paused;
            smtc.IsEnabled = true;
            smtc.IsPlayEnabled = true;
            smtc.IsPauseEnabled = true;
            smtc.IsNextEnabled = playbackInfo.NextSongIndex != null;
            smtc.IsPreviousEnabled = playbackInfo.PreviousSongIndex != null;

            if (metadataHash != LastMetadataHash)
            {
                smtc.DisplayUpdater.Type = MediaPlaybackType.Music;
                smtc.DisplayUpdater.MusicProperties.Title = song?.Title ?? "Unknown Title";
                smtc.DisplayUpdater.MusicProperties.Artist = artistNames;
                smtc.DisplayUpdater.MusicProperties.AlbumTitle = song?.Album ?? "Unknown Album";
                smtc.DisplayUpdater.MusicProperties.AlbumArtist = albumArtistNames;

                smtc.DisplayUpdater.MusicProperties.Genres.Clear();
                smtc.DisplayUpdater.MusicProperties.Genres.Add("FocalSonic-" + (song?.Id ?? "unknown"));

                // Request from a fellow developer, they want to be able to read the Apple Music Catalog ID from SMTC
                if (isAppleMusicPlayer && !string.IsNullOrEmpty(song?.Id))
                {
                    smtc.DisplayUpdater.MusicProperties.Genres.Add("AM-" + song?.Id);
                    smtc.DisplayUpdater.MusicProperties.Genres.Add("AppleMusic-" + song?.Id);
                }

                if (player != null)
                {
                    smtc.DisplayUpdater.MusicProperties.Genres.Add("PlaybackSpeed-" + playerSpeed);
                }

                if (string.IsNullOrEmpty(coverArt))
                {
                    using (var stream = Program.App.CurrentServerManager.Resolver.OpenFileStream("/default_album_art.png"))
                    {
                        LastAlbumArt = RandomAccessStreamReference.CreateFromStream(stream.AsRandomAccessStream());
                    }
                }
                else
                {
                    LastAlbumArt = RandomAccessStreamReference.CreateFromUri(new Uri(coverArt));
                }

                smtc.DisplayUpdater.Thumbnail = LastAlbumArt;
                smtc.DisplayUpdater.Update();
                LastMetadataHash = metadataHash;
            }

            smtc.UpdateTimelineProperties(new SystemMediaTransportControlsTimelineProperties()
            {
                StartTime = TimeSpan.Zero,
                Position = playbackInfo.Position,
                EndTime = playbackInfo.Duration
            });

            if (!HasRegisteredEvents)
            {
                HasRegisteredEvents = true;
                smtc.ButtonPressed += async (sender, args) =>
                {
                    var info = MediaPlaybackInfo.Instance;
                    if (info == null) return;

                    // Immediately update SMTC status so repeated presses register correctly
                    if (args.Button == SystemMediaTransportControlsButton.Play)
                    {
                        smtc.PlaybackStatus = MediaPlaybackStatus.Playing;
                        await info.Play();
                    }
                    else if (args.Button == SystemMediaTransportControlsButton.Pause)
                    {
                        smtc.PlaybackStatus = MediaPlaybackStatus.Paused;
                        await info.Pause();
                    }
                    else if (args.Button == SystemMediaTransportControlsButton.Next)
                    {
                        await info.NextSong();
                    }
                    else if (args.Button == SystemMediaTransportControlsButton.Previous)
                    {
                        await info.PreviousSong();
                    }
                };
            }

            // Window title
            var windowTitle = !string.IsNullOrEmpty(song?.Title) ? song?.Title + " | FocalSonic" : null;
            if (Program.MainWindow != null && !string.IsNullOrEmpty(windowTitle) && windowTitle != LastWindowTitle)
            {
                Program.MainWindow.Title = windowTitle;
                LastWindowTitle = windowTitle;
            }
        }
    }
}

#endif