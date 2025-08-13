using Newtonsoft.Json;
using System.Collections.Generic;

namespace SamsidParty.Subsonic.Proxy.AppleMusic.Types
{
    public class AlbumResponse
    {
        [JsonProperty("data")]
        public List<Album> Data { get; set; }
    }
}
