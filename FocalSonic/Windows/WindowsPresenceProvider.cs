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

namespace FocalSonic.Windows
{
    public class WindowsPresenceProvider : PresenceProvider
    {
        public static MediaPlayer HostPlayer = new MediaPlayer();

        private string? LastSongID;
        private RandomAccessStreamReference LastAlbumArt; // Prevents refreshing album art every time which wastes resources

        public override async Task UpdateMediaStatus(MediaPlaybackInfo playbackInfo)
        {
            var song = playbackInfo.CurrentSong;
            SystemMediaTransportControls smtc = HostPlayer.SystemMediaTransportControls;
            HostPlayer.CommandManager.IsEnabled = false;
            smtc.PlaybackStatus = playbackInfo.IsPlaying ? MediaPlaybackStatus.Playing : MediaPlaybackStatus.Paused;
            smtc.IsEnabled = true;
            smtc.IsPlayEnabled = true;
            smtc.IsPauseEnabled = true;

            smtc.DisplayUpdater.Type = MediaPlaybackType.Music;
            
            smtc.DisplayUpdater.MusicProperties.Title = song?.Title ?? "Unknown Title";
            smtc.DisplayUpdater.MusicProperties.Artist = string.Join(", ", song?.Artists?.Select((a) => a.Name) ?? new string[] { song?.Artist ?? "" });
            smtc.DisplayUpdater.MusicProperties.AlbumTitle = song?.Album ?? "Unknown Album";
            smtc.DisplayUpdater.MusicProperties.AlbumArtist = string.Join(", ", song?.AlbumArtists?.Select((a) => a.Name) ?? new string[] { song?.DisplayAlbumArtist ?? "" });

            var coverArt = playbackInfo.Store.ExtraProperties.GetCoverArtForSong(song?.CoverArt!);

            if (song?.Id != LastSongID || LastAlbumArt == null)
            {
                if (string.IsNullOrEmpty(coverArt))
                {
                    using (var stream = Program.App.CurrentServerManager.Resolver.OpenFileStream("/default_album_art.png"))
                    {
                        smtc.DisplayUpdater.Thumbnail = RandomAccessStreamReference.CreateFromStream(stream.AsRandomAccessStream());
                    }
                }
                else
                {
                    smtc.DisplayUpdater.Thumbnail = RandomAccessStreamReference.CreateFromUri(new Uri(coverArt));
                }
                LastAlbumArt = smtc.DisplayUpdater.Thumbnail;
            }

            smtc.UpdateTimelineProperties(new SystemMediaTransportControlsTimelineProperties()
            {
                StartTime = TimeSpan.Zero,
                Position = playbackInfo.Position,
                EndTime = playbackInfo.Duration
            });

            smtc.ButtonPressed += (sender, args) =>
            {
                if (args.Button == SystemMediaTransportControlsButton.Play)
                {
                    AudioPlayer.AudioPlayer.Instance?.PlayAudio();
                }
                else if (args.Button == SystemMediaTransportControlsButton.Pause)
                {
                    AudioPlayer.AudioPlayer.Instance?.PauseAudio();
                }
            };

            smtc.DisplayUpdater.Update();
            LastSongID = song?.Id ?? null;
        }
    }
}

#endif