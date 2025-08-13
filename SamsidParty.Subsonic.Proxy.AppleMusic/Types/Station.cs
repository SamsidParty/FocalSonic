using Newtonsoft.Json;

namespace SamsidParty.Subsonic.Proxy.AppleMusic.Types
{
    public class Station : Resource
    {
        [JsonProperty("type")]
        public new string Type { get; set; } = "stations";

        [JsonProperty("artwork")]
        public Artwork Artwork { get; set; }

        [JsonProperty("durationInMillis")]
        public int? DurationInMillis { get; set; }

        [JsonProperty("editorialNotes")]
        public EditorialNotes EditorialNotes { get; set; }

        [JsonProperty("episodeNumber")]
        public int? EpisodeNumber { get; set; }

        [JsonProperty("isLive")]
        public bool IsLive { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("url")]
        public string Url { get; set; }
    }
}
