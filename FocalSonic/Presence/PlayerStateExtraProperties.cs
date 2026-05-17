using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using SamsidParty.Subsonic.Common.Types;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FocalSonic.Presence
{
    public class PlayerStateExtraProperties
    {
        [JsonProperty("coverArtBaseURL")]
        public string CoverArtBaseURL;

        [JsonProperty("streamBaseURL")]
        public string StreamBaseURL;

        public string GetCoverArtForSong(string coverArtID)
        {
            if (string.IsNullOrEmpty(CoverArtBaseURL)) return string.Empty;
            return CoverArtBaseURL.Replace("{id}", coverArtID).Replace("{w}", "300").Replace("{h}", "300").Replace("{f}", "jpg");
        }

        public string GetStreamURLForSong(Song song)
        {
            if (string.IsNullOrEmpty(StreamBaseURL)) return string.Empty;
            return StreamBaseURL.Replace("{id}", song.PlaybackID ?? song.Id);
        }

        [JsonExtensionData]
        public IDictionary<string, JToken> ExtensionData { get; set; }
    }
}
