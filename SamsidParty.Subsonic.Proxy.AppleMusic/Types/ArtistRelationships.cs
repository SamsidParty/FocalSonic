using Newtonsoft.Json;

namespace SamsidParty.Subsonic.Proxy.AppleMusic.Types
{
    public class ArtistRelationships
    {
        [JsonProperty("albums")]
        public Relationship<Album> Albums { get; set; }

        [JsonProperty("genres")]
        public Relationship<Genre> Genres { get; set; }
    }
}
