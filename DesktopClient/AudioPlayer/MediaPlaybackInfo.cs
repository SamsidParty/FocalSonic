using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Aonsoku.AudioPlayer
{
    public class MediaPlaybackInfo : MediaInfo
    {
        public bool IsPlaying = false;
        public TimeSpan Duration = TimeSpan.Zero;
        public TimeSpan Position = TimeSpan.Zero;
    }
}
