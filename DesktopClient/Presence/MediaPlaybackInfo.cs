using IgniteView.Core;
using Newtonsoft.Json;
using SamsidParty.Subsonic.Common.Types;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Mapster;
using Aonsoku.AudioPlayer;

namespace Aonsoku.Presence
{
    public class MediaPlaybackInfo
    {
        public static MediaPlaybackInfo Instance = new MediaPlaybackInfo();

        public bool IsPlaying = false;
        [JsonIgnore] public TimeSpan Duration = TimeSpan.Zero;
        [JsonIgnore] public TimeSpan Position = TimeSpan.Zero;

        [JsonProperty("currentSong")]
        public Song? CurrentSong;

        [JsonProperty("currentSongIndex")]
        public int CurrentSongIndex;

        [JsonProperty("queue")]
        public List<Song> Queue = new List<Song>();

        // This is different than AudioPlayer.Looping
        [JsonProperty("loopState")]
        public PlayerLoopState LoopState = PlayerLoopState.Off;

        [Command("setCurrentMediaInfo")]
        public static async Task SetCurrentMediaInfo(string info)
        {
            if (string.IsNullOrEmpty(info)) { return; }

            MediaPlaybackInfo newState;

            try 
            {
                newState = JsonConvert.DeserializeObject<MediaPlaybackInfo>(info)!;
            }
            catch
            {
                // Discard the current info
                Instance = new MediaPlaybackInfo();
                return;
            }

            if (newState!.CurrentSong == null || string.IsNullOrEmpty(newState.CurrentSong.Id)) { newState.CurrentSong = null; }
            if (newState!.Queue == null || newState!.Queue.Count > 0) { Instance.Queue = new List<Song>(); }

            // Keep old values
            newState.Position = Instance.Position;
            newState.Duration = Instance.Duration;

            Instance = newState;
        }
    }
}
