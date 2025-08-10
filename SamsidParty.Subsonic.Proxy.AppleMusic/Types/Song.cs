using Newtonsoft.Json;
using SamsidParty.Subsonic.Common;
using SamsidParty.Subsonic.Common.Types;

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

        public Child ToSubsonicType()
        {
            return new Child()
            {
                Id = "applemusic\n" + Id + "\n" + Attributes.PlayParams.Id,
                IsDir = false,
                IsVideo = false,
                Type = GenericMediaType.Music,
                Title = Attributes.Name,
                Album = Attributes.AlbumName,
                Artist = Attributes.ArtistName,
                DisplayAlbumArtist = Attributes.ArtistName,
                DiscNumber = Attributes.DiscNumber,
                Track = Attributes.TrackNumber,
                Year = int.Parse(Attributes.ReleaseDate.Substring(0, 4)),
                ContentType = "audio/m4a",
                Suffix = "m4a",
                Duration = Attributes.DurationInMillis / 1000,
                CoverArt = Attributes.Artwork.Url
            };
        }
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
