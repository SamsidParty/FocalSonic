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
        public string OutputDevice = "local";
        public bool HasLoaded;
        public bool Looping;
        public float Volume = 1.0f;
        public float Speed = 1.0f;
        public string FilterData = "";
        internal int AssociatedWindowID;
        internal WebWindow? AssociatedWindow => AppManager.Instance.OpenWindows.Where((w) => w.ID == AssociatedWindowID).FirstOrDefault();

        public virtual string ChromecastCredential => "";

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

        public async Task HandleTimeUpdate(bool isPlaying, double currentPlaybackTime, double currentPlaybackDuration, string source = "local")
        {
            // Only accept time updates from the current source
            if (source != OutputDevice) return;

            if (isPlaying)
            {
                if (currentPlaybackTime >= 0) AssociatedWindow?.CallFunction("handleAudioEvent_" + ID, "timeupdate", currentPlaybackTime);
                if (currentPlaybackDuration >= 0) AssociatedWindow?.CallFunction("handleAudioEvent_" + ID, "durationupdate", currentPlaybackDuration);
            }


            MediaPlaybackInfo.Instance.IsPlaying = isPlaying;
            MediaPlaybackInfo.Instance.Duration = TimeSpan.FromSeconds(currentPlaybackDuration);
            MediaPlaybackInfo.Instance.Position = TimeSpan.FromSeconds(currentPlaybackTime);
        }

        public virtual async Task SetSource(string src, WebWindow ctx) 
        {
            if (Source == src) { return; } // Already set
            await UpdatePrePlaybackParameters();

            if (ctx != null)
            {
                AssociatedWindowID = ctx.ID;
            }

            if (Source == src) { return; } // Already set

            await Casting.Casting.LoadMedia(src);
        }

        public virtual async Task PlayAudio() {
            await Casting.Casting.PlayMedia();
        }

        public virtual async Task PauseAudio() {
            await Casting.Casting.PauseMedia();
        }

        public virtual async Task SeekAudio(double time) {
            await Casting.Casting.SeekMedia(time);
        }

        public virtual async Task SetLoopMode(bool loop) { Looping = loop; }
        public virtual async Task SetOutputDevice(string outputDevice) { OutputDevice = outputDevice; }
        public virtual async Task SetVolume(double volume) { Volume = (float)volume; }
        public virtual async Task SetSpeed(double speed) { Speed = (float)speed; }
        public virtual async Task SetFilterData(string filterData) { FilterData = filterData; }
        public virtual async Task SetEnableAtmos(bool enabled) { }

        public async Task CallEndEvent()
        {
            MediaPlaybackInfo.Instance?.NextSong();
        }
        
        public async Task CallLoadEvent(double duration)
        {
            HasLoaded = true;

            if (AssociatedWindow != null && Program.App.OpenWindows.Contains(AssociatedWindow))
            {
                AssociatedWindow?.CallFunction("handleAudioEvent_" + this.ID, "loaded", duration);
            }
        }

        public async Task UpdatePrePlaybackParameters()
        {
            await SetEnableAtmos(MediaPlaybackInfo.Instance?.Store?.ExtraProperties?.EnableAtmos ?? false);
        }

        public async Task UpdatePlaybackParameters()
        {
            await SetLoopMode(Looping);
            await SetVolume(Volume);
            await SetSpeed(Speed);
        }

        [Command("setAudioPlayerSource")] public static async Task SetSourceOnPlayer(string id, string src, WebWindow ctx) => RunOnPlayer(id, (p) => p.SetSource(src, ctx));
        [Command("playAudio")] public static async Task PlayAudioOnPlayer(string id) => RunOnPlayer(id, (p) => p.PlayAudio());
        [Command("pauseAudio")] public static async Task PauseAudioOnPlayer(string id) => RunOnPlayer(id, (p) => p.PauseAudio());
        [Command("seekAudio")] public static async Task SeekAudioOnPlayer(string id, double time) => RunOnPlayer(id, (p) => p.SeekAudio(time));
        [Command("setAudioPlayerLoopMode")] public static async Task SetLoopModeOnPlayer(string id, bool loop) => RunOnPlayer(id, (p) => p.SetLoopMode(loop));
        [Command("setAudioPlayerVolume")] public static async Task SetVolumeOnPlayer(string id, double volume) => RunOnPlayer(id, (p) => p.SetVolume(volume));
        [Command("setAudioPlayerSpeed")] public static async Task SetSpeedOnPlayer(string id, double speed) => RunOnPlayer(id, (p) => p.SetSpeed(speed));
        [Command("setAudioPlayerOutputDevice")] public static async Task SetOutputDeviceOnPlayer(string id, string outputDevice) => RunOnPlayer(id, (p) => p.SetOutputDevice(outputDevice));
        [Command("setAudioPlayerFilterData")] public static async Task SetFilterDataOnPlayer(string id, string filterData) => RunOnPlayer(id, (p) => p.SetFilterData(filterData));

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
