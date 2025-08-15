using FocalSonic.AudioPlayer;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FocalSonic.Presence
{
    public class PlayerState
    {
        [JsonProperty("isPlaying")]
        public bool IsPlaying = false;

        [JsonProperty("loopState")]
        public PlayerLoopState LoopState;

        [JsonExtensionData]
        public IDictionary<string, JToken> ExtensionData { get; set; }
    }
}
