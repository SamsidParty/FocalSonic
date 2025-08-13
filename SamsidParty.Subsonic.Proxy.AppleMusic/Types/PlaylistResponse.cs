using Newtonsoft.Json;
using System.Collections.Generic;

namespace SamsidParty.Subsonic.Proxy.AppleMusic.Types
{
    public class PlaylistResponse
    {
        [JsonProperty("data")]
        public List<Playlist> Data { get; set; }
    }
}
