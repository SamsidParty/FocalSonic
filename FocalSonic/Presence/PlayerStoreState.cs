using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FocalSonic.Presence
{
    public class PlayerStoreState
    {
        [JsonProperty("songlist")]
        public PlayerSongList SongList;

        [JsonProperty("playerState")]
        public PlayerState PlayerState;

        // Used within the PresenceHash calculation, this number can be manually updated in order to force a refresh of the presence
        [JsonProperty("presenceNonce")]
        public Int64 PresenceNonce = 0;

        [JsonExtensionData]
        public IDictionary<string, JToken> ExtensionData { get; set; }
    }
}
