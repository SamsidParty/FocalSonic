using Newtonsoft.Json;

namespace SamsidParty.Subsonic.Proxy.AppleMusic.Types
{
    public class Curator : Resource
    {
        [JsonProperty("attributes")]
        public CuratorAttributes Attributes { get; set; }

        [JsonProperty("relationships")]
        public CuratorRelationships Relationships { get; set; }

        [JsonProperty("type")]
        public new string Type { get; set; } = "curators";
    }

    public class CuratorAttributes
    {
        [JsonProperty("artwork")]
        public Artwork Artwork { get; set; }

        [JsonProperty("editorialNotes")]
        public EditorialNotes EditorialNotes { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("url")]
        public string Url { get; set; }
    }

    public class CuratorRelationships
    {
        [JsonProperty("playlists")]
        public Relationship<Playlist> Playlists { get; set; }
    }
}
