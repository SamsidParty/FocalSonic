using Mapster;
using Newtonsoft.Json;
using SamsidParty.Subsonic.Common;

namespace SamsidParty.Subsonic.Proxy.AppleMusic.Types
{
    public class Album : Resource
    {
        [JsonProperty("attributes")]
        public AlbumAttributes Attributes { get; set; }

        [JsonProperty("relationships")]
        public AlbumRelationships Relationships { get; set; }

        [JsonProperty("type")]
        public new string Type { get; set; } = "albums";

        public Subsonic.Common.Child ToSubsonicType()
        {
            return new Common.Child
            {
                Id = Id,
                IsDir = true,
                IsVideo = false,
                Title = Attributes.Name,
                Album = Attributes.Name,
                Artist = Attributes.ArtistName,
                DisplayAlbumArtist = Attributes.ArtistName,
                Year = int.Parse(Attributes.ReleaseDate.Substring(0, 4)),
                CoverArt = Attributes.Artwork.Url,
                Genres = Attributes.GenreNames?.Select((a) => new ItemGenre() { Name = a }).ToList(),
                Genre = Attributes.GenreNames != null ? string.Join(", ", Attributes.GenreNames) : "",
                Created = (Attributes.DateAdded != null) ? new DateTimeOffset((DateTime)Attributes.DateAdded!) : DateTimeOffset.MinValue,
                AdditionalProperties = new Dictionary<string, object>()
                {
                    { "name", Attributes.Name },
                    { "songCount", Attributes.TrackCount },
                }
            };
        }

        public Subsonic.Common.AlbumID3 ToSubsonicTypeID3()
        {
            var values = ToSubsonicType();
            var adapted = values.Adapt<AlbumID3>();
            adapted.AdditionalProperties = new Dictionary<string, object>();
            adapted.Name = values.Title;
            return adapted;
        }

    }

    public class AlbumAttributes
    {
        [JsonProperty("albumName")]
        public string AlbumName { get; set; }

        [JsonProperty("artistName")]
        public string ArtistName { get; set; }

        [JsonProperty("artwork")]
        public Artwork Artwork { get; set; }

        [JsonProperty("contentRating")]
        public string ContentRating { get; set; }

        [JsonProperty("copyright")]
        public string Copyright { get; set; }

        [JsonProperty("editorialNotes")]
        public EditorialNotes EditorialNotes { get; set; }

        [JsonProperty("genreNames")]
        public System.Collections.Generic.List<string> GenreNames { get; set; }

        [JsonProperty("isCompilation")]
        public bool IsCompilation { get; set; }

        [JsonProperty("isComplete")]
        public bool IsComplete { get; set; }

        [JsonProperty("isSingle")]
        public bool IsSingle { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("playParams")]
        public PlayParameters PlayParams { get; set; }

        [JsonProperty("recordLabel")]
        public string RecordLabel { get; set; }

        [JsonProperty("releaseDate")]
        public string ReleaseDate { get; set; }

        [JsonProperty("dateAdded")]
        public DateTime? DateAdded { get; set; }

        [JsonProperty("trackCount")]
        public int TrackCount { get; set; }

        [JsonProperty("url")]
        public string Url { get; set; }

        [JsonProperty("isMasteredForItunes")]
        public bool IsMasteredForItunes { get; set; }
    }
}
