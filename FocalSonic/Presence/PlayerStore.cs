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

            // "{}" means the caller had nothing to publish, not "the queue is empty".
            if (store?.State == null)
            {
                Console.Error.WriteLine("Ignoring player store update with no state");
                return;
            }

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

            if (store?.State == null)
            {
                Console.Error.WriteLine("Ignoring mini player store update with no state");
                return;
            }

            try
            {
                lock (MediaPlaybackInfo.Instance)
                {
                    // Null-safe: this threw when no store existed yet, and the catch
                    // then discarded the whole update (isPlaying and index included).
                    store.State.SongList = MediaPlaybackInfo.Instance.Store?.State?.SongList;
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

        [Command("setPlayerCallbackData")]
        public static async Task SetPlayerCallbackData(string key, string value)
        {
            Dictionary<string, string> snapshot = null;

            try
            {
                lock (MediaPlaybackInfo.Instance)
                {
                    var callbackData = MediaPlaybackInfo.Instance?.Store?.State?.PlayerCallbackData;

                    if (callbackData != null)
                    {
                        if (string.IsNullOrEmpty(value))
                        {
                            callbackData.Remove(key);
                        }
                        else
                        {
                            callbackData[key] = value;
                        }

                        snapshot = new Dictionary<string, string>(callbackData);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine("Failed to update music playback info: " + ex.Message);
            }

            // Push only the callback data. This used to call rehydratePlayerStore, which
            // makes the UI replace its whole state with C#'s (possibly stale) snapshot.
            if (snapshot != null)
            {
                Program.MainWindow?.CallFunction("window.rehydratePlayerCallbackData", JsonConvert.SerializeObject(snapshot));
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

            // GetPlayerStore answers "{}" until the UI publishes; mutating that NREs on
            // a background thread and the broken result got broadcast to the UI.
            if (playerStore?.State?.PlayerState == null)
            {
                Console.Error.WriteLine("Skipping player store mutation: nothing published yet");
                return;
            }

            await mutateFn(playerStore);
            await SetPlayerStore(JsonConvert.SerializeObject(playerStore), null);
        }
    }
}
