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
        public static async Task SetPlayerStore(string data)
        {
            await PlatformManager.Instance.Storage.WriteAllText("focalsonic_player_store.json", data);

            try
            {
                MediaPlaybackInfo.Instance.Store = JsonConvert.DeserializeObject<PlayerStore>(data);
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine("Failed to update music playback info: " + ex.Message);
            }
        }

        [Command("getPlayerStore")]
        public static async Task<string> GetPlayerStore()
        {
            return await PlatformManager.Instance.Storage.ReadAllText("focalsonic_player_store.json");
        }
    }
}
