using FocalSonic.AppleMusic;
using FocalSonic.ListenTogether.Core;
using FocalSonic.ListenTogether.Session;
using FocalSonic.OverrideSystem;
using FocalSonic.Persistence;
using FocalSonic.Presence;
using IgniteView.Core;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using SamsidParty.Subsonic.Common.Types;
using System.Reflection;
using System.Runtime.InteropServices;
using Player = FocalSonic.AudioPlayer.AudioPlayer;

namespace FocalSonic.ListenTogether
{
    /// <summary>The session's view of the app: <see cref="PlayerStore"/>, the audio engine and <see cref="SharedStore"/>.</summary>
    internal sealed class AppBridge : ILtApp
    {
        const string EffectsBackupKey = "listen_together_effects_backup";
        const string DisplayNameKey = "listen_together_name";
        const string StorageNamespace = "shared";

        static readonly AsyncLocal<bool> WritingStore = new();
        static readonly AsyncLocal<bool> WritingEffects = new();
        public bool IsWritingStore => WritingStore.Value;
        public bool IsWritingEffects => WritingEffects.Value;

        string lastPlaybackSignature = "";

        public static bool IsAppleMusicSignedIn => !string.IsNullOrEmpty(AppleMusicKeys.MediaUserToken);

        public string Storefront => (AppleMusicKeys.Region ?? "us").ToLowerInvariant();

        public string Platform =>
            RuntimeInformation.IsOSPlatform(OSPlatform.OSX) ? "macos" :
            RuntimeInformation.IsOSPlatform(OSPlatform.Windows) ? "windows" : "linux";

        public string AppVersion => Assembly.GetExecutingAssembly().GetName().Version?.ToString() ?? "0";

        public async Task<JObject?> AppleMusicGet(string path) => await AppleMusicHttpClient.SendRequest<JObject>(path);

        #region Player store

        static JObject? StoreJson()
        {
            var info = MediaPlaybackInfo.Instance;
            lock (info)
            {
                return info.Store == null ? null : JObject.FromObject(info.Store, JsonSerializer.Create(JsonConvert.DefaultSettings?.Invoke()));
            }
        }

        static List<JObject> Songs(JToken? token) => (token as JArray)?.OfType<JObject>().ToList() ?? new List<JObject>();

        public LtStoreView ReadStore()
        {
            var store = StoreJson();
            var state = store?["state"] as JObject;
            var songlist = state?["songlist"] as JObject;
            var playerState = state?["playerState"] as JObject;
            var stamp = state?["listenTogether"] as JObject;

            return new LtStoreView
            {
                Current = Songs(songlist?["currentList"]),
                Original = Songs(songlist?["originalList"]),
                Index = songlist?.Value<int?>("currentSongIndex") ?? 0,
                Playing = playerState?.Value<bool?>("isPlaying") ?? false,
                Loop = playerState?.Value<int?>("loopState") ?? 0,
                Shuffle = playerState?.Value<bool?>("isShuffleActive") ?? false,
                MediaType = playerState?.Value<string>("mediaType") ?? "song",
                RadioId = songlist?.Value<string>("currentRadioID"),
                Station = songlist?["currentRadioStation"] as JObject,
                Stamp = stamp?.Value<int?>("v") ?? -1,
                StampSession = stamp?.Value<string>("sid"),
            };
        }

        /// <summary>Cheap check for a "mini" store sync (no queue): did anything the session follows change?</summary>
        public bool PlaybackStateChanged()
        {
            var store = MediaPlaybackInfo.Instance.Store;
            var playerState = store?.State?.PlayerState;
            if (playerState == null) return false;

            JToken? Extra(IDictionary<string, JToken>? data, string key) => data != null && data.TryGetValue(key, out var value) ? value : null;
            var signature = $"{playerState.IsPlaying}|{(int)playerState.LoopState}|{Extra(playerState.ExtensionData, "isShuffleActive")}|" +
                $"{Extra(playerState.ExtensionData, "mediaType")}|{Extra(store!.State.ExtensionData, "listenTogether")?.ToString(Formatting.None)}|" +
                $"{store.State.SongList?.CurrentSongIndex}";

            if (signature == lastPlaybackSignature) return false;
            lastPlaybackSignature = signature;
            return true;
        }

        public async Task WriteStore(LtStoreWrite write)
        {
            var store = StoreJson() ?? new JObject();
            var state = store["state"] as JObject ?? (JObject)(store["state"] = new JObject());
            var songlist = state["songlist"] as JObject ?? (JObject)(state["songlist"] = new JObject());
            var playerState = state["playerState"] as JObject ?? (JObject)(state["playerState"] = new JObject());

            var index = write.Current.Count == 0 ? 0 : Math.Clamp(write.Index, 0, write.Current.Count - 1);
            var currentSong = write.Current.Count > 0 ? write.Current[index] : new JObject();
            var previousSongId = (songlist["currentSong"] as JObject)?.Value<string>(LtSongs.EntryIdKey) ?? (songlist["currentSong"] as JObject)?.Value<string>("id");
            var newSongId = currentSong.Value<string>(LtSongs.EntryIdKey) ?? currentSong.Value<string>("id");

            songlist["currentList"] = new JArray(write.Current);
            songlist["originalList"] = new JArray(write.Original);
            songlist["shuffledList"] = write.Shuffle ? new JArray(write.Current) : new JArray();
            songlist["currentSongIndex"] = index;
            songlist["currentSong"] = currentSong;
            var originalIndex = write.Original.FindIndex((s) => s.Value<string>(LtSongs.EntryIdKey) == currentSong.Value<string>(LtSongs.EntryIdKey));
            songlist["originalSongIndex"] = Math.Max(0, originalIndex);
            songlist["radioList"] = new JArray();
            songlist["currentRadioID"] = write.RadioId;
            songlist["currentRadioStation"] = write.Station;

            playerState["isPlaying"] = write.Playing;
            playerState["loopState"] = write.Loop;
            playerState["isShuffleActive"] = write.Shuffle;
            playerState["mediaType"] = "song";

            if (previousSongId != newSongId) state["playerProgress"] = new JObject { ["progress"] = 0 };
            state["listenTogether"] = new JObject { ["v"] = write.Stamp, ["sid"] = write.SessionId };

            if (store["extraProperties"] is not JObject)
            {
                store["extraProperties"] = new JObject { ["coverArtBaseURL"] = "{id}", ["streamBaseURL"] = "{id}" };
            }

            WritingStore.Value = true;
            try
            {
                await PlayerStore.SetPlayerStore(store.ToString(Formatting.None), null);
            }
            finally
            {
                WritingStore.Value = false;
            }
        }

        public async Task ClearStamp()
        {
            var store = StoreJson();
            if (store?["state"] is not JObject state || state["listenTogether"] == null) return;
            state.Remove("listenTogether");

            WritingStore.Value = true;
            try { await PlayerStore.SetPlayerStore(store.ToString(Formatting.None), null); }
            finally { WritingStore.Value = false; }
        }

        #endregion

        #region Effects

        public (double Speed, string FilterData) ReadEffects()
        {
            var state = SharedStore.GetCurrentState();
            return (state.Speed, state.FilterData ?? "");
        }

        public async Task WriteEffects(double speed, string filterData)
        {
            var raw = SharedStore.GetSharedStore();
            JObject snapshot;
            try { snapshot = string.IsNullOrWhiteSpace(raw) ? new JObject() : JObject.Parse(raw); }
            catch { snapshot = new JObject(); }

            var state = snapshot["state"] as JObject ?? (JObject)(snapshot["state"] = JObject.FromObject(SharedStore.GetCurrentState()));
            state["speed"] = speed;
            state["filterData"] = filterData;
            snapshot["version"] ??= SharedStore.CurrentVersion;

            WritingEffects.Value = true;
            try
            {
                await SharedStore.SetSharedStore(snapshot.ToString(Formatting.None), null);
            }
            finally
            {
                WritingEffects.Value = false;
            }

            // The UI forwards these to the engine, but the window may be closed.
            var effective = SharedStore.GetCurrentState();
            await OnPlayer((p) =>
            {
                _ = p.SetSpeed(effective.Speed > 0 ? effective.Speed : 1);
                if (!string.IsNullOrEmpty(effective.FilterData)) _ = p.SetFilterData(effective.FilterData);
            });
        }

        public bool HasImpulse(string impulseId)
        {
            if (!impulseId.StartsWith(ImpulseOverrides.IdPrefix)) return true; // Bundled with the app.
            return File.Exists(ImpulseOverrides.GetImpulseFilePath(impulseId));
        }

        public async Task BeginGuestEffects()
        {
            var (speed, filter) = ReadEffects();
            var existing = await LocalStorage.GetItem(EffectsBackupKey, StorageNamespace);
            // Keep an older backup: it's the user's real settings from before a crash mid-session.
            if (!string.IsNullOrEmpty(existing)) return;
            LocalStorage.SetItem(EffectsBackupKey, new JObject { ["speed"] = speed, ["filterData"] = filter }.ToString(Formatting.None), StorageNamespace);
        }

        public async Task EndGuestEffects() => await RestoreEffectsBackupIfAny();

        public async Task RestoreEffectsBackupIfAny()
        {
            try
            {
                var raw = await LocalStorage.GetItem(EffectsBackupKey, StorageNamespace);
                if (string.IsNullOrEmpty(raw)) return;
                var backup = JObject.Parse(raw);
                await WriteEffects(backup.Value<double?>("speed") ?? 1, backup.Value<string>("filterData") ?? "");
                LocalStorage.SetItem(EffectsBackupKey, "", StorageNamespace);
                LtLog.Info("Restored your own speed and effects");
            }
            catch (Exception ex)
            {
                LtLog.Warn("Couldn't restore effects: " + ex.Message);
            }
        }

        #endregion

        #region Engine

        static Player? Engine => Player.Instance;

        static Task OnPlayer(Action<Player> action)
        {
            var player = Engine;
            return player == null ? Task.CompletedTask : Player.RunOnPlayer(player.ID, action);
        }

        public string? EngineSource => Engine?.Source;
        public bool EngineLoaded => Engine?.HasLoaded ?? false;
        public double EnginePosition => MediaPlaybackInfo.Instance.Position.TotalSeconds;

        public async Task Load(string playbackId, bool play)
        {
            if (Engine == null)
            {
                // No engine yet (the window never opened): create one, as the UI would.
                await Player.CreateAudioPlayer("appleMusicPlayer", null);
            }

            await OnPlayer((p) =>
            {
                p.BlockedSource = null;
                _ = p.ResetSource();
                _ = p.SetSource(playbackId, null);
                _ = p.UpdatePlaybackParameters();
                _ = play ? p.PlayAudio() : p.PauseAudio();
            });
        }

        public Task Play() => OnPlayer((p) => { if (p.BlockedSource == null) _ = p.PlayAudio(); });
        public Task Pause() => OnPlayer((p) => _ = p.PauseAudio());
        public Task Seek(double seconds) => OnPlayer((p) => _ = p.SeekAudio(seconds));

        public Task Silence() => OnPlayer((p) =>
        {
            p.BlockedSource = p.Source ?? "blocked";
            _ = p.PauseAudio();
            _ = p.ResetSource();
        });

        public void ShowVirtualProgress(double position, double duration, bool playing)
        {
            var info = MediaPlaybackInfo.Instance;
            info.Position = TimeSpan.FromSeconds(Math.Max(0, position));
            if (duration > 0) info.Duration = TimeSpan.FromSeconds(duration);

            var player = Engine;
            var window = Program.MainWindow;
            if (player == null || window == null) return;
            window.CallFunction("handleAudioEvent_" + player.ID, "timeupdate", position);
            if (duration > 0) window.CallFunction("handleAudioEvent_" + player.ID, "durationupdate", duration);
        }

        #endregion

        #region Host queue actions

        public Task HostAdvance() => MediaPlaybackInfo.Instance.NextSong(false);
        public Task HostNext() => MediaPlaybackInfo.Instance.NextSong(true);
        public Task HostPrevious() => MediaPlaybackInfo.Instance.PreviousSong(true);
        public Task HostSetPlaying(bool playing) => playing ? MediaPlaybackInfo.Instance.Play() : MediaPlaybackInfo.Instance.Pause();

        /// <summary>The same as toggleShuffle in player.store.ts: songs already played stay put, the rest is shuffled.</summary>
        public Task HostSetShuffle(bool shuffle) => PlayerStore.Mutate(async (store) =>
        {
            var songlist = store.State.SongList;
            var playerState = store.State.PlayerState;
            if (songlist?.CurrentList == null || playerState == null) return;

            var baseList = songlist.OriginalList?.Count > 0 ? songlist.OriginalList : songlist.CurrentList;
            var currentEntry = EntryKey(songlist.CurrentSong);
            var index = baseList.FindIndex((s) => EntryKey(s) == currentEntry);
            if (index < 0) index = baseList.FindIndex((s) => s.Id == songlist.CurrentSong?.Id);
            if (baseList.Count <= 1 || index < 0) return;

            List<Song> next;
            if (shuffle)
            {
                var rest = baseList.Skip(index + 1).ToList();
                Random.Shared.Shuffle(System.Runtime.InteropServices.CollectionsMarshal.AsSpan(rest));
                next = baseList.Take(index + 1).Concat(rest).ToList();
                songlist.ShuffledList = next.ToList();
            }
            else
            {
                next = baseList.ToList();
            }

            songlist.OriginalList = baseList.ToList();
            songlist.CurrentList = next;
            songlist.CurrentSongIndex = index;
            songlist.CurrentSong = next[index];
            songlist.ExtensionData ??= new Dictionary<string, JToken>();
            songlist.ExtensionData["originalSongIndex"] = index;
            playerState.ExtensionData ??= new Dictionary<string, JToken>();
            playerState.ExtensionData["isShuffleActive"] = shuffle;
        });

        static string? EntryKey(Song? song)
        {
            if (song == null) return null;
            return song.AdditionalProperties.TryGetValue(LtSongs.EntryIdKey, out var value) ? value?.ToString() : song.Id;
        }

        #endregion

        #region UI

        public void PublishStatus(JObject status) => ListenTogether.PublishStatus(status);

        public void Notify(string level, string message)
        {
            LtLog.Info($"({level}) {message}");
            Program.MainWindow?.CallFunction("window.listenTogetherNotify", level, message);
        }

        public void SessionEnded()
        {
            lastPlaybackSignature = "";
            _ = OnPlayer((p) => p.BlockedSource = null);
        }

        public void SaveDisplayName(string name)
        {
            if (!string.IsNullOrWhiteSpace(name)) LocalStorage.SetItem(DisplayNameKey, LtText.CleanName(name, ""), StorageNamespace);
        }

        public string LoadDisplayName()
        {
            try
            {
                var saved = LocalStorage.GetItem(DisplayNameKey, StorageNamespace).Result;
                if (!string.IsNullOrWhiteSpace(saved)) return saved;
            }
            catch { }

            var user = Environment.UserName ?? "";
            return user.Length > 0 ? char.ToUpperInvariant(user[0]) + user[1..] : "";
        }

        #endregion
    }
}
