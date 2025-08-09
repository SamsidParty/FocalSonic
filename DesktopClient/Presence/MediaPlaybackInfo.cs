using Aonsoku.Types;
using IgniteView.Core;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Aonsoku.Presence
{
    public class MediaPlaybackInfo
    {
        public static MediaPlaybackInfo Instance = new MediaPlaybackInfo();

        public bool IsPlaying = false;
        public TimeSpan Duration = TimeSpan.Zero;
        public TimeSpan Position = TimeSpan.Zero;

        [JsonProperty("currentSong")]
        public Song CurrentSong;


        [Command("setCurrentMediaInfo")]
        public static async Task SetCurrentMediaInfo(string info)
        {
            Instance = JsonConvert.DeserializeObject<MediaPlaybackInfo>(info);
        }
    }
}
