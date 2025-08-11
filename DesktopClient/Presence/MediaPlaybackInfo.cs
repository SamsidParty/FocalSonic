using IgniteView.Core;
using Newtonsoft.Json;
using SamsidParty.Subsonic.Common.Types;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Mapster;

namespace Aonsoku.Presence
{
    public class MediaPlaybackInfo
    {
        public static MediaPlaybackInfo Instance = new MediaPlaybackInfo();

        public bool IsPlaying = false;
        public TimeSpan Duration = TimeSpan.Zero;
        public TimeSpan Position = TimeSpan.Zero;

        [JsonProperty("currentSong")]
        public Song? CurrentSong;


        [Command("setCurrentMediaInfo")]
        public static async Task SetCurrentMediaInfo(string info)
        {
            if (string.IsNullOrEmpty(info)) { return; }
            try { Instance.CurrentSong = JsonConvert.DeserializeObject<Song>(info); }
            catch { Instance.CurrentSong = null; }
        }
    }
}
