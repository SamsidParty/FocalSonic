using IgniteView.Core;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Aonsoku.AudioPlayer
{
    public class AudioPlayer
    {
        public static ConcurrentDictionary<string, AudioPlayer> ActivePlayers = new ConcurrentDictionary<string, AudioPlayer>();

        public string ID;
        public string Source;
        public bool HasLoaded;
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

        public virtual async Task SendTimeUpdate(bool isAutomatic = true) { }
        public virtual async Task SetSource(string src, WebWindow ctx) { }
        public virtual async Task PlayAudio() { }
        public virtual async Task PauseAudio() { }
        public virtual async Task SeekAudio(double time) { }
        public virtual async Task SetLoopMode(bool loop) { }
        public virtual async Task SetVolume(double volume) { }



        [Command("setAudioPlayerSource")] public static async Task SetSourceOnPlayer(string id, string src, WebWindow ctx) => RunOnPlayer(id, (p) => p.SetSource(src, ctx));
        [Command("playAudio")] public static async Task PlayAudioOnPlayer(string id) => RunOnPlayer(id, (p) => p.PlayAudio());
        [Command("pauseAudio")] public static async Task PauseAudioOnPlayer(string id) => RunOnPlayer(id, (p) => p.PauseAudio());
        [Command("seekAudio")] public static async Task SeekAudioOnPlayer(string id, double time) => RunOnPlayer(id, (p) => p.SeekAudio(time));
        [Command("setAudioPlayerLoopMode")] public static async Task SetLoopModeOnPlayer(string id, bool loop) => RunOnPlayer(id, (p) => p.SetLoopMode(loop));
        [Command("setAudioPlayerVolume")] public static async Task SetVolumeOnPlayer(string id, double volume) => RunOnPlayer(id, (p) => p.SetVolume(volume));
    }
}
