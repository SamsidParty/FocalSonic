using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Aonsoku.Types
{
    public struct Song
    {
        [JsonProperty("id")]
        public string ID;

        [JsonProperty("parent")]
        public string Parent;

        [JsonProperty("isDir")]
        public bool IsDir;

        [JsonProperty("title")]
        public string Title;

        [JsonProperty("album")]
        public string Album;

        [JsonProperty("artist")]
        public string Artist;

        [JsonProperty("track")]
        public int Track;

        [JsonProperty("year")]
        public int Year;

        [JsonProperty("genre")]
        public string Genre;

        [JsonProperty("coverArt")]
        public string CoverArt;

        [JsonProperty("size")]
        public int Size;

        [JsonProperty("contentType")]
        public string ContentType;

        [JsonProperty("suffix")]
        public string Suffix;

        [JsonProperty("duration")]
        public int Duration;

        [JsonProperty("bitRate")]
        public int BitRate;

        [JsonProperty("path")]
        public string Path;

        [JsonProperty("playCount")]
        public int PlayCount;

        [JsonProperty("discNumber")]
        public int DiscNumber;

        [JsonProperty("created")]
        public string Created;

        [JsonProperty("albumId")]
        public string AlbumId;

        [JsonProperty("artistId")]
        public string ArtistId;

        [JsonProperty("type")]
        public string Type;

        [JsonProperty("isVideo")]
        public bool IsVideo;

        [JsonProperty("played")]
        public string Played;

        [JsonProperty("bpm")]
        public int Bpm;

        [JsonProperty("starred")]
        public string Starred;

        [JsonProperty("comment")]
        public string Comment;

        [JsonProperty("sortName")]
        public string SortName;

        [JsonProperty("mediaType")]
        public string MediaType;

        [JsonProperty("musicBrainzId")]
        public string MusicBrainzId;

        [JsonProperty("channelCount")]
        public int ChannelCount;

        [JsonProperty("samplingRate")]
        public int SamplingRate;

        [JsonProperty("bitDepth")]
        public int BitDepth;

        [JsonProperty("moods")]
        public IEnumerable<string> Moods;

        [JsonProperty("artists")]
        public IEnumerable<FeaturedArtist> Artists;

        [JsonProperty("displayArtist")]
        public string DisplayArtist;

        [JsonProperty("albumArtists")]
        public IEnumerable<FeaturedArtist> AlbumArtists;

        [JsonProperty("displayAlbumArtist")]
        public string DisplayAlbumArtist;

        [JsonProperty("contributors")]
        public IEnumerable<Contributor> Contributors;

        [JsonProperty("displayComposer")]
        public string DisplayComposer;

        [JsonProperty("explicitStatus")]
        public string ExplicitStatus;
    }
}
