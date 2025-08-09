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

namespace Aonsoku.Presence
{
    public class WindowsPresenceProvider : PresenceProvider
    {
        public static MediaPlayer HostPlayer = new MediaPlayer();

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
            
            smtc.DisplayUpdater.MusicProperties.Title = song.Title ?? "Unknown Title";
            smtc.DisplayUpdater.MusicProperties.Artist = string.Join(", ", song.Artists?.Select((a) => a.Name) ?? new string[0]) ?? "Unknown Artist";
            smtc.DisplayUpdater.MusicProperties.AlbumTitle = song.Album ?? "Unknown Album";
            smtc.DisplayUpdater.MusicProperties.AlbumArtist = string.Join(", ", song.AlbumArtists?.Select((a) => a.Name) ?? new string[0]) ?? "Unknown Album";

            if (string.IsNullOrEmpty(song.CoverArt))
            {
                using (var stream = Program.App.CurrentServerManager.Resolver.OpenFileStream("/default_album_art.png"))
                {
                    smtc.DisplayUpdater.Thumbnail = RandomAccessStreamReference.CreateFromStream(stream.AsRandomAccessStream());
                }
            }
            else
            {
                smtc.DisplayUpdater.Thumbnail = RandomAccessStreamReference.CreateFromUri(new Uri(song.CoverArt));
            }

            smtc.UpdateTimelineProperties(new SystemMediaTransportControlsTimelineProperties()
            {
                StartTime = TimeSpan.Zero,
                Position = playbackInfo.Position,
                EndTime = playbackInfo.Duration
            });

            smtc.DisplayUpdater.Update();
        }
    }
}
