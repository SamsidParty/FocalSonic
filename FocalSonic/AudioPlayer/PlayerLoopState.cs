using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FocalSonic.AudioPlayer
{
    public enum PlayerLoopState : int
    {
        Off = 0,
        All = 1,
        One = 2,
        InfiniteRadio = 3 // Apple Music only, this is for (non-live) radio stations
    }
}
