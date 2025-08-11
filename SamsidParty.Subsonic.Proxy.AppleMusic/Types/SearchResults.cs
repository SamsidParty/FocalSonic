using Newtonsoft.Json;

namespace SamsidParty.Subsonic.Proxy.AppleMusic.Types
{
    public class SearchResults
    {
        [JsonProperty("artists")]
        public ArtistResponse Artists { get; set; }

        [JsonProperty("albums")]
        public AlbumResponse Albums { get; set; }

        [JsonProperty("songs")]
        public SongResponse Songs { get; set; }


        [JsonProperty("library-artists")]
        public ArtistResponse LibraryArtists { get => Artists; set => Artists = value; }

        [JsonProperty("library-albums")]
        public AlbumResponse LibraryAlbums { get => Albums; set => Albums = value; }

        [JsonProperty("library-songs")]
        public SongResponse LibrarySongs { get => Songs; set => Songs = value; }
    }
}
