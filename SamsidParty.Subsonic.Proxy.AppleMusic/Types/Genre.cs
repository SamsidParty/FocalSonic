using Newtonsoft.Json;

namespace SamsidParty.Subsonic.Proxy.AppleMusic.Types
{
    public class Genre : Resource
    {
        [JsonProperty("attributes")]
        public GenreAttributes Attributes { get; set; }

        [JsonProperty("type")]
        public new string Type { get; set; } = "genres";
    }

    public class GenreAttributes
    {
        [JsonProperty("name")]
        public string Name { get; set; }
    }
}
