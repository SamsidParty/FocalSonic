using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Windows.Media;
using Windows.Media.Control;
using Windows.Media.Playback;

namespace Aonsoku.AudioPlayer
{
    public class MediaStatusDisplay
    {
        public static MediaPlayer HostPlayer = new MediaPlayer();

        public static void UpdateDisplay(MediaPlaybackInfo playbackInfo)
        {
            SystemMediaTransportControls smtc = HostPlayer.SystemMediaTransportControls;
            HostPlayer.CommandManager.IsEnabled = false;
            smtc.PlaybackStatus = playbackInfo.IsPlaying ? MediaPlaybackStatus.Playing : MediaPlaybackStatus.Paused;
            smtc.IsEnabled = true;
            smtc.IsPlayEnabled = true;
            smtc.IsPauseEnabled = true;
            smtc.DisplayUpdater.Type = MediaPlaybackType.Music;

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
