using Newtonsoft.Json;

namespace SamsidParty.Subsonic.Proxy.AppleMusic.Types
{
    public class Artist : Resource
    {
        [JsonProperty("attributes")]
        public ArtistAttributes Attributes { get; set; }

        [JsonProperty("relationships")]
        public ArtistRelationships Relationships { get; set; }

        [JsonProperty("type")]
        public new string Type { get; set; } = "artists";
    }

    public class ArtistAttributes
    {
        [JsonProperty("editorialNotes")]
        public EditorialNotes EditorialNotes { get; set; }

        [JsonProperty("genreNames")]
        public System.Collections.Generic.List<string> GenreNames { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("url")]
        public string Url { get; set; }
    }
}
