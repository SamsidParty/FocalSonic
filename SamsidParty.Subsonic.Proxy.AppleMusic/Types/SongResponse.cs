using Newtonsoft.Json;
using System.Collections.Generic;

namespace SamsidParty.Subsonic.Proxy.AppleMusic.Types
{
    public class SongResponse
    {
        [JsonProperty("data")]
        public List<Song> Data { get; set; }
    }
}
