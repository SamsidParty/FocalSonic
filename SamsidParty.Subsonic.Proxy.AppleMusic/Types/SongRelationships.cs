using Newtonsoft.Json;

namespace SamsidParty.Subsonic.Proxy.AppleMusic.Types
{
    public class SongRelationships
    {
        [JsonProperty("albums")]
        public Relationship<Album> Albums { get; set; }

        [JsonProperty("artists")]
        public Relationship<Artist> Artists { get; set; }

        [JsonProperty("genres")]
        public Relationship<Genre> Genres { get; set; }

        [JsonProperty("station")]
        public StationData Station { get; set; }
    }

    public class StationData
    {
        [JsonProperty("data")]
        public Station Data { get; set; }
    }
}
