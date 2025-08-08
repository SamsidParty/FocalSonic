using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Aonsoku.Presence
{
    public abstract class PresenceProvider
    {
        public abstract void UpdateMediaStatus(MediaPlaybackInfo playbackInfo);
    }
}
