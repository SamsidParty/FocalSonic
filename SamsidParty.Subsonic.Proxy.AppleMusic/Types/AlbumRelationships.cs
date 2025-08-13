using Newtonsoft.Json;

namespace SamsidParty.Subsonic.Proxy.AppleMusic.Types
{
    public class AlbumRelationships
    {
        [JsonProperty("artists")]
        public Relationship<Artist> Artists { get; set; }

        [JsonProperty("tracks")]
        public Relationship<Song> Tracks { get; set; }

        [JsonProperty("genres")]
        public Relationship<Genre> Genres { get; set; }
    }
}
