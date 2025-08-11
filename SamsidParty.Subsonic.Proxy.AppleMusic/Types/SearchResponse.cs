using Newtonsoft.Json;

namespace SamsidParty.Subsonic.Proxy.AppleMusic.Types
{
    public class SearchResponse
    {
        [JsonProperty("results")]
        public SearchResults Results { get; set; }
    }
}
