using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Windows.Media;
using Windows.Media.Control;
using Windows.Media.Playback;

namespace Aonsoku.Presence
{
    public class WindowsPresenceProvider : PresenceProvider
    {
        public static MediaPlayer HostPlayer = new MediaPlayer();

        public override void UpdateMediaStatus(MediaPlaybackInfo playbackInfo)
        {
            SystemMediaTransportControls smtc = HostPlayer.SystemMediaTransportControls;
            HostPlayer.CommandManager.IsEnabled = false;
            smtc.PlaybackStatus = playbackInfo.IsPlaying ? MediaPlaybackStatus.Playing : MediaPlaybackStatus.Paused;
            smtc.IsEnabled = true;
            smtc.IsPlayEnabled = true;
            smtc.IsPauseEnabled = true;

            smtc.DisplayUpdater.Type = MediaPlaybackType.Music;
            smtc.DisplayUpdater.MusicProperties.Title = playbackInfo.Title ?? "Unknown Title";
            smtc.DisplayUpdater.MusicProperties.Artist = playbackInfo.Artist ?? "Unknown Artist";
            smtc.DisplayUpdater.MusicProperties.AlbumTitle = playbackInfo.Album ?? "Unknown Album";

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
