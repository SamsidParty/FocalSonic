using FocalSonic.AudioPlayer;
using FocalSonic.Presence;
using IgniteView.Core;
using IgniteView.Core.Types;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace FocalSonic.Persistence
{
    public class SharedStoreState
    {
        // Matches EFFECT_LIMITS in src-vite/src/utils/audioEffects.ts
        public const double MinSpeed = 0.0625;
        public const double MaxSpeed = 16;
        public const int MaxFilterDataLength = 64 * 1024;

        [JsonProperty("enableDiscordPresence")]
        public bool EnableDiscordPresence = false;

        [JsonProperty("enableAtmos")]
        public bool EnableAtmos = false;

        [JsonProperty("volume")]
        public double Volume = 100;

        /// <summary>
        /// Playback speed. A negative value means "disabled, but remember this level".
        /// </summary>
        [JsonProperty("speed")]
        public double Speed = 1;

        /// <summary>
        /// Serialized EQ bands, with reverb and the impulse response riding on band 0.
        /// </summary>
        [JsonProperty("filterData")]
        public string FilterData = string.Empty;

        public void Normalize()
        {
            if (double.IsNaN(Volume) || double.IsInfinity(Volume))
            {
                Volume = 100;
            }

            Volume = Math.Clamp(Volume, 0, 100);

            if (double.IsNaN(Speed) || double.IsInfinity(Speed) || Speed == 0)
            {
                Speed = 1;
            }
            else
            {
                Speed = Math.Sign(Speed) * Math.Clamp(Math.Abs(Speed), MinSpeed, MaxSpeed);
            }

            FilterData = NormalizeFilterData(FilterData);
        }

        /// <summary>
        /// Effects are edited entirely on the JS side, so all this has to guarantee is
        /// that a corrupt or oversized payload never makes it back out of storage.
        /// </summary>
        static string NormalizeFilterData(string? filterData)
        {
            if (string.IsNullOrWhiteSpace(filterData)) { return string.Empty; }
            if (filterData.Length > MaxFilterDataLength) { return string.Empty; }

            try
            {
                return JToken.Parse(filterData) is JArray ? filterData : string.Empty;
            }
            catch
            {
                return string.Empty;
            }
        }
    }

    public class SharedStoreSnapshot
    {
        [JsonProperty("state")]
        public SharedStoreState State = new SharedStoreState();

        [JsonProperty("version")]
        public int Version = SharedStore.CurrentVersion;

        [JsonExtensionData]
        public IDictionary<string, JToken> ExtensionData { get; set; } = new Dictionary<string, JToken>();
    }

    public class SharedStore
    {
        public const string StorageKey = "shared_store";
        public const string StorageNamespace = "shared";
        public const int CurrentVersion = 1;

        static SharedStoreSnapshot CreateDefaultSnapshot()
        {
            return new SharedStoreSnapshot();
        }

        static string LoadRawStore()
        {
            try
            {
                return LocalStorage.GetItem(StorageKey, StorageNamespace).Result;
            }
            catch { }
            return string.Empty;
        }

        static SharedStoreSnapshot ParseSnapshot(string? data)
        {
            if (string.IsNullOrWhiteSpace(data) || data == "{}")
            {
                return CreateDefaultSnapshot();
            }

            try
            {
                var snapshot = JsonConvert.DeserializeObject<SharedStoreSnapshot>(data);

                if (snapshot?.State == null)
                {
                    return CreateDefaultSnapshot();
                }

                snapshot.Version = snapshot.Version <= 0 ? CurrentVersion : snapshot.Version;
                snapshot.State.Normalize();
                return snapshot;
            }
            catch
            {
                return CreateDefaultSnapshot();
            }
        }

        public static SharedStoreState GetCurrentState()
        {
            return ParseSnapshot(LoadRawStore()).State;
        }

        [Command("getSharedStore")]
        public static string GetSharedStore()
        {
            return LoadRawStore();
        }

        [Command("setSharedStore")]
        public static async Task SetSharedStore(string data, WebWindow ctx)
        {
            var previousState = GetCurrentState();
            var snapshot = ParseSnapshot(data);
            var serializedSnapshot = JsonConvert.SerializeObject(snapshot);

            LocalStorage.SetItem(StorageKey, serializedSnapshot, StorageNamespace);

            await ApplyState(previousState, snapshot.State, ctx == null);

            if (ctx == null)
            {
                Program.MainWindow?.CallFunction("window.rehydrateSharedStore", serializedSnapshot);
            }
        }

        static async Task ApplyState(SharedStoreState previousState, SharedStoreState nextState, bool shouldApplyVolume)
        {
            if (previousState.EnableAtmos != nextState.EnableAtmos)
            {
                foreach (var player in AudioPlayer.AudioPlayer.ActivePlayers.Values)
                {
                    await AudioPlayer.AudioPlayer.RunOnPlayer(player.ID, (p) => p.SetEnableAtmos(nextState.EnableAtmos));
                }
            }

            if (shouldApplyVolume && previousState.Volume != nextState.Volume)
            {
                var normalizedVolume = nextState.Volume / 100.0;

                foreach (var player in AudioPlayer.AudioPlayer.ActivePlayers.Values)
                {
                    await AudioPlayer.AudioPlayer.RunOnPlayer(player.ID, (p) => p.SetVolume(normalizedVolume));
                }
            }

            if (previousState.EnableDiscordPresence != nextState.EnableDiscordPresence && Presence.Presence.Instance != null)
            {
                Presence.Presence.Instance.LastPresenceHash = string.Empty;
                await Presence.Presence.Instance.UpdateMediaStatus(MediaPlaybackInfo.Instance);
            }
        }
    }
}
