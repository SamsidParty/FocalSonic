using Newtonsoft.Json;

namespace SamsidParty.Subsonic.Proxy.AppleMusic.Types
{
    public class Preview
    {
        [JsonProperty("artwork")]
        public Artwork Artwork { get; set; }

        [JsonProperty("url")]
        public string Url { get; set; }
    }
}
