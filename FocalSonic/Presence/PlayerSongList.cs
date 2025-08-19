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

        [JsonProperty("shuffledList")]
        public List<Song> ShuffledList;

        [JsonProperty("originalList")]
        public List<Song> OriginalList;

        [JsonProperty("currentSongIndex")]
        public int CurrentSongIndex;

        [JsonProperty("currentRadioID")]
        public string? CurrentRadioID; // For apple music radio stations

        [JsonExtensionData]
        public IDictionary<string, JToken> ExtensionData { get; set; }
    }
}
