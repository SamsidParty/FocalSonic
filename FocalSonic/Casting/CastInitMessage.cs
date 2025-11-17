using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FocalSonic.Casting
{
    public class CastInitMessage
    {
        [JsonProperty("playbackInterfaceName")]
        public string PlaybackInterfaceName;

        [JsonProperty("playbackInterfaceToken")]
        public string PlaybackInterfaceToken;

        public CastInitMessage(string playbackInterfaceName, string playbackInterfaceToken)
        {
            PlaybackInterfaceName = playbackInterfaceName;
            PlaybackInterfaceToken = playbackInterfaceToken;
        }
    }
}
