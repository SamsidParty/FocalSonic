using Newtonsoft.Json;

namespace SamsidParty.Subsonic.Proxy.AppleMusic.Types
{
    public class Playlist : Resource
    {
        [JsonProperty("attributes")]
        public PlaylistAttributes Attributes { get; set; }

        [JsonProperty("relationships")]
        public PlaylistRelationships? Relationships { get; set; }

        [JsonProperty("type")]
        public new string Type { get; set; } = "playlists";

        public Subsonic.Common.Playlist ToSubsonicType()
        {
            return new Common.Playlist
            {
                Id = Id,
                Name = Attributes.Name,
                Public = Attributes.IsPublic ?? false,
                Created = Attributes.DateAdded,
                Changed = Attributes.DateAdded,
                SongCount = Relationships?.Tracks.Data.Count ?? 0,
                Duration = 0,
            };
        }
    }

    public class PlaylistAttributes
    {
        [JsonProperty("artwork")]
        public Artwork Artwork { get; set; }

        [JsonProperty("curatorName")]
        public string CuratorName { get; set; }

        [JsonProperty("description")]
        public EditorialNotes Description { get; set; }

        [JsonProperty("lastModifiedDate")]
        public string LastModifiedDate { get; set; }

        [JsonProperty("isChart")]
        public bool? IsChart { get; set; }

        [JsonProperty("isPublic")]
        public bool? IsPublic { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("playParams")]
        public PlayParameters PlayParams { get; set; }

        [JsonProperty("playlistType")]
        public string PlaylistType { get; set; }

        [JsonProperty("url")]
        public string Url { get; set; }

        [JsonProperty("dateAdded")]
        public DateTime DateAdded { get; set; }
    }

    public class PlaylistRelationships
    {
        [JsonProperty("curator")]
        public Relationship<Curator> Curator { get; set; }

        [JsonProperty("tracks")]
        public Relationship<Song> Tracks { get; set; }
    }
}
