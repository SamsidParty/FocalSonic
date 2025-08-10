using Newtonsoft.Json;
using System.Collections.Generic;

namespace SamsidParty.Subsonic.Proxy.AppleMusic.Types
{
    public class Relationship<T>
    {
        [JsonProperty("data")]
        public List<T> Data { get; set; }

        [JsonProperty("href")]
        public string Href { get; set; }

        [JsonProperty("meta")]
        public object Meta { get; set; }

        [JsonProperty("next")]
        public string Next { get; set; }
    }
}
