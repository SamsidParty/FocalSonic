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
    public class PlayerSongList
    {
        [JsonProperty("currentSong")]
        public Song? CurrentSong;

        [JsonProperty("currentList")]
        public List<Song> CurrentList;

        [JsonProperty("currentSongIndex")]
        public int CurrentSongIndex;

        [JsonExtensionData]
        public IDictionary<string, JToken> ExtensionData { get; set; }
    }
}
