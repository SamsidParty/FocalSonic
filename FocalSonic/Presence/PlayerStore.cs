using IgniteView.Core;
using IgniteView.Core.Types;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FocalSonic.Presence
{
    public class PlayerStore
    {
        [JsonProperty("state")]
        public PlayerStoreState State;

        [JsonProperty("extraProperties")]
        public PlayerStateExtraProperties ExtraProperties;

        [JsonExtensionData]
        public IDictionary<string, JToken> ExtensionData { get; set; }

        [Command("setPlayerStore")]
        public static async Task SetPlayerStore(string data, WebWindow ctx)
        {
            var store = JsonConvert.DeserializeObject<PlayerStore>(data);

            try
            {
                lock (MediaPlaybackInfo.Instance)
                {
                    MediaPlaybackInfo.Instance.Store = store;
                }
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine("Failed to update music playback info: " + ex.Message);
            }

            // If was not updated from the WebWindow, we need to tell it to rehydrate
            if (ctx == null)
            {
                Program.MainWindow?.CallFunction("window.rehydratePlayerStore", JsonConvert.SerializeObject(store));
            }
        }

        [Command("setPlayerStoreMini")]
        public static async Task SetPlayerStoreMini(string data, WebWindow ctx)
        {
            var store = JsonConvert.DeserializeObject<PlayerStore>(data);

            try
            {
                lock (MediaPlaybackInfo.Instance)
                {
                    store.State.SongList = MediaPlaybackInfo.Instance.Store.State.SongList; // Preserve song list
                    MediaPlaybackInfo.Instance.Store = store;
                }
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine("Failed to update music playback info: " + ex.Message);
            }

            // If was not updated from the WebWindow, we need to tell it to rehydrate
            if (ctx == null)
            {
                Program.MainWindow?.CallFunction("window.rehydratePlayerStore", JsonConvert.SerializeObject(store));
            }
        }

        [Command("getPlayerStore")]
        public static string GetPlayerStore()
        {
            return MediaPlaybackInfo.Instance.Store == null ? "{}" : JsonConvert.SerializeObject(MediaPlaybackInfo.Instance.Store);
        }

        /// <summary>
        /// Easily modify the player store by passing a function that takes the PlayerStore as an argument.
        /// </summary>
        public static async Task Mutate(Func<PlayerStore, Task> mutateFn)
        {
            var playerStore = JsonConvert.DeserializeObject<PlayerStore>(GetPlayerStore());
            await mutateFn(playerStore);
            await SetPlayerStore(JsonConvert.SerializeObject(playerStore), null);
        }
    }
}
