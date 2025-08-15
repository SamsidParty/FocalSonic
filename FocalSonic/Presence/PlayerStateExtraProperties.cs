using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
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
            return CoverArtBaseURL.Replace("{id}", coverArtID).Replace("{w}", "300").Replace("{h}", "300");
        }

        public string GetStreamURLForSong(string songID)
        {
            if (string.IsNullOrEmpty(CoverArtBaseURL)) return string.Empty;
            return CoverArtBaseURL.Replace("{id}", songID);
        }

        [JsonExtensionData]
        public IDictionary<string, JToken> ExtensionData { get; set; }
    }
}
