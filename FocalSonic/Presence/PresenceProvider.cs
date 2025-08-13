using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FocalSonic.Presence
{
    public abstract class PresenceProvider
    {
        public abstract Task UpdateMediaStatus(MediaPlaybackInfo playbackInfo);
    }
}
