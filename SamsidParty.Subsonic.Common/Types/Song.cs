using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace SamsidParty.Subsonic.Common.Types
{
    // The only reason that this class exists is because it's confusing to use "Child" in the codebase instead of "Song"
    public class Song : Child {
        [JsonProperty("playbackID")]
        [JsonPropertyName("playbackID")]
        public string PlaybackID { get; set; }
    }
}
