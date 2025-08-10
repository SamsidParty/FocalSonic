using Newtonsoft.Json;

namespace SamsidParty.Subsonic.Proxy.AppleMusic.Types
{
    public class Song : Resource
    {
        [JsonProperty("type")]
        public new string Type { get; set; } = "songs";

        [JsonProperty("attributes")]
        public SongAttributes Attributes { get; set; }

        [JsonProperty("relationships")]
        public SongRelationships Relationships { get; set; }
    }

    public class SongAttributes
    {
        [JsonProperty("albumName")]
        public string AlbumName { get; set; }

        [JsonProperty("artistName")]
        public string ArtistName { get; set; }

        [JsonProperty("artwork")]
        public Artwork Artwork { get; set; }

        [JsonProperty("composerName")]
        public string ComposerName { get; set; }

        [JsonProperty("contentRating")]
        public string ContentRating { get; set; }

        [JsonProperty("discNumber")]
        public int DiscNumber { get; set; }

        [JsonProperty("durationInMillis")]
        public int DurationInMillis { get; set; }

        [JsonProperty("editorialNotes")]
        public EditorialNotes EditorialNotes { get; set; }

        [JsonProperty("genreNames")]
        public System.Collections.Generic.List<string> GenreNames { get; set; }

        [JsonProperty("hasLyrics")]
        public bool HasLyrics { get; set; }

        [JsonProperty("isrc")]
        public string Isrc { get; set; }

        [JsonProperty("movementCount")]
        public int? MovementCount { get; set; }

        [JsonProperty("movementName")]
        public string MovementName { get; set; }

        [JsonProperty("movementNumber")]
        public string MovementNumber { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("playParams")]
        public PlayParameters PlayParams { get; set; }

        [JsonProperty("previews")]
        public System.Collections.Generic.List<Preview> Previews { get; set; }

        [JsonProperty("releaseDate")]
        public string ReleaseDate { get; set; }

        [JsonProperty("trackNumber")]
        public int TrackNumber { get; set; }

        [JsonProperty("url")]
        public string Url { get; set; }

        [JsonProperty("workName")]
        public string WorkName { get; set; }
    }
}
