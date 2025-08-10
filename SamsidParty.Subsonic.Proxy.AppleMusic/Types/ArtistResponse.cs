using Newtonsoft.Json;
using System.Collections.Generic;

namespace SamsidParty.Subsonic.Proxy.AppleMusic.Types
{
    public class ArtistResponse
    {
        [JsonProperty("data")]
        public List<Artist> Data { get; set; }
    }
}
