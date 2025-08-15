using FocalSonic.AppleMusic;
using FocalSonic.Presence;
using IgniteView.Core;
using Newtonsoft.Json;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Dynamic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FocalSonic.AudioPlayer
{
    public class AudioPlayer : IDisposable
    {
        public static ConcurrentDictionary<string, AudioPlayer> ActivePlayers = new ConcurrentDictionary<string, AudioPlayer>();
        public static AudioPlayer? Instance => ActivePlayers.FirstOrDefault().Value;

        public string ID;
        public string Source;
        public bool HasLoaded;
        public bool Looping;
        public float Volume = 1.0f;
        internal int AssociatedWindowID;
        internal WebWindow? AssociatedWindow => AppManager.Instance.OpenWindows.Where((w) => w.ID == AssociatedWindowID).FirstOrDefault();

        public AudioPlayer(string id)
        {
            ID = id;
            ActivePlayers.TryAdd(id, this);
        }

        // We need to run all functions on the player thread for the following reasons:
        // 1. Prevents freezing and stuttering the UI
        // 2. Ensures that the WebWindow is properly garbage collected while the player is still running
        public static async Task RunOnPlayerThread(Action f)
        {
            PlayerThread.ActionQueue.Enqueue(f);
        }

        public static async Task RunOnPlayer(string id, Action<AudioPlayer> f)
        {
            if (!ActivePlayers.ContainsKey(id)) return;
            await RunOnPlayerThread(async () =>
            {
                if (ActivePlayers.TryGetValue(id, out var player))
                {
                    f.Invoke(player);
                }
            });
        }

        [Command("createAudioPlayer")]
        public static async Task CreateAudioPlayer(string id, WebWindow ctx)
        {
            await RunOnPlayerThread(() =>
            {
                AudioPlayer? player = null;

                if (ActivePlayers.TryGetValue(id, out player)) { }
                else if (id.StartsWith("appleMusicPlayer"))
                {
                    player = new AppleMusicAudioPlayer(id);
                }
                else
                {
                    player = new SoundFlowAudioPlayer(id);
                }

                player.AssociatedWindowID = ctx.ID;
            });
        }

        public virtual async Task SendTimeUpdate(bool isAutomatic = true) 
        {
            await Presence.Presence.Instance.UpdateMediaStatus(MediaPlaybackInfo.Instance);
        }

        public virtual async Task SetSource(string src, WebWindow ctx) 
        {
            if (ctx != null)
            {
                AssociatedWindowID = ctx.ID;
            }
        }

        public virtual async Task PlayAudio() { }
        public virtual async Task PauseAudio() { }
        public virtual async Task SeekAudio(double time) { }
        public virtual async Task SetLoopMode(bool loop) { Looping = loop; }
        public virtual async Task SetVolume(double volume) { Volume = (float)volume; }

        public async Task CallEndEvent()
        {
            if (AssociatedWindow != null && Program.App.OpenWindows.Contains(AssociatedWindow))
            {
                AssociatedWindow?.CallFunction("handleAudioEvent_" + ID, "ended");
            }
            else
            {
                MediaPlaybackInfo.Instance?.NextSong();
            }
        }
        
        public async Task CallLoadEvent(double duration)
        {
            HasLoaded = true;

            if (AssociatedWindow != null && Program.App.OpenWindows.Contains(AssociatedWindow))
            {
                AssociatedWindow?.CallFunction("handleAudioEvent_" + this.ID, "loaded", duration);
            }
            else
            {

                // Modify the localStorage to reflect these changes
                dynamic playerStore = JsonConvert.DeserializeObject<ExpandoObject>(LocalStorage.GetItem("player_store", "default"));
                playerStore.state.playerState.currentDuration = duration;
                LocalStorage.SetItem("player_store", JsonConvert.SerializeObject(playerStore), "default");
            }
        }

        public async Task UpdatePlaybackParameters()
        {
            await SetLoopMode(Looping);
            await SetVolume(Volume);
        }

        [Command("setAudioPlayerSource")] public static async Task SetSourceOnPlayer(string id, string src, WebWindow ctx) => RunOnPlayer(id, (p) => p.SetSource(src, ctx));
        [Command("playAudio")] public static async Task PlayAudioOnPlayer(string id) => RunOnPlayer(id, (p) => p.PlayAudio());
        [Command("pauseAudio")] public static async Task PauseAudioOnPlayer(string id) => RunOnPlayer(id, (p) => p.PauseAudio());
        [Command("seekAudio")] public static async Task SeekAudioOnPlayer(string id, double time) => RunOnPlayer(id, (p) => p.SeekAudio(time));
        [Command("setAudioPlayerLoopMode")] public static async Task SetLoopModeOnPlayer(string id, bool loop) => RunOnPlayer(id, (p) => p.SetLoopMode(loop));
        [Command("setAudioPlayerVolume")] public static async Task SetVolumeOnPlayer(string id, double volume) => RunOnPlayer(id, (p) => p.SetVolume(volume));

        [Command("disposeAudioPlayer")] 
        public static async Task DisposeAudioPlayer(string id)
        {
            await RunOnPlayer(id, (p) => p.Dispose());
        }

        [Command("disposeAllAudioPlayers")] 
        public static async Task DisposeAudioPlayers()
        {
            foreach (var player in ActivePlayers.Values)
            {
                player.Dispose();
            }
            ActivePlayers.Clear();
        }

        public virtual void Dispose()
        {
            MediaPlaybackInfo.Instance = new MediaPlaybackInfo(null);
            ActivePlayers.TryRemove(ID, out _);
        }
    }
}
