using IgniteView.Core;
using NAudio.Wave;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Numerics;
using System.Text;
using System.Threading.Tasks;

namespace Aonsoku.AudioPlayer
{
    public class AudioPlayer
    {
        public static ConcurrentDictionary<string, AudioPlayer> ActivePlayers = new ConcurrentDictionary<string, AudioPlayer>();

        public string ID;
        public string Source;
        public bool Loop = false;

        int AssociatedWindowID;
        MediaFoundationReader? DataReader;
        DirectSoundOut? DataPlayer;
        WebWindow? AssociatedWindow => AppManager.Instance.OpenWindows.Where((w) => w.ID == AssociatedWindowID).FirstOrDefault();

        public AudioPlayer(string id)
        {
            ID = id;
            ActivePlayers.TryAdd(id, this);
        }

        public async Task SendTimeUpdate(bool isAutomatic = true)
        {
            if (DataPlayer != null && DataReader != null)
            {
                if (DataPlayer.PlaybackState == PlaybackState.Playing)
                {
                    AssociatedWindow?.CallFunction("handleAudioEvent_" + ID, "timeupdate", DataReader.CurrentTime.TotalSeconds);
                }

                if (DataReader.TotalTime.Subtract(DataReader.CurrentTime).TotalSeconds < 1 && isAutomatic)
                {
                    await Task.Delay(1000); // Makes sure the audio is fully finished
                    if (Loop)
                    {
                        await SeekAudio(ID, 0);
                        if (DataPlayer.PlaybackState == PlaybackState.Stopped)
                        {
                            await PlayAudio(ID);
                        } 
                    }
                    else
                    {
                        AssociatedWindow?.CallFunction("handleAudioEvent_" + ID, "ended");
                    }
                }
            }
        }

        // We need to run all functions on the player thread for the following reasons:
        // 1. Prevents freezing and stuttering the UI
        // 2. Ensures that the WebWindow is properly garbage collected while the player is still running
        public static async Task RunOnPlayerThread(Action f)
        {
            PlayerThread.ActionQueue.Enqueue(f);
        }

        [Command("createAudioPlayer")]
        public static async Task CreateAudioPlayer(string id)
        {
            await RunOnPlayerThread(() =>
            {
                if (ActivePlayers.ContainsKey(id)) { return; }
                var player = new AudioPlayer(id);
            });
        }

        [Command("setAudioPlayerSource")]
        public static async Task SetSource(string id, string src, WebWindow ctx)
        {
            await RunOnPlayerThread(() =>
            {
                if (ActivePlayers.TryGetValue(id, out var player))
                {

                    if (player.Source == src) { return; } // Already set

                    player.Source = src;
                    player.AssociatedWindowID = ctx.ID;

                    if (!string.IsNullOrEmpty(src))
                    {
                        if (player.DataPlayer != null)
                        {
                            player.DataPlayer.Stop();
                            player.DataPlayer.Dispose();
                            player.DataPlayer = null;
                        }

                        player.DataReader = new MediaFoundationReader(src);

                        player.DataPlayer = new DirectSoundOut();
                        player.DataPlayer.Init(player.DataReader);

                        ctx.CallFunction("handleAudioEvent_" + id, "loaded", player.DataReader.TotalTime.TotalSeconds);
                    }
                    else
                    {
                        player.DataReader = null;
                    }
                }
            });
        }

        [Command("playAudio")]
        public static async Task PlayAudio(string id)
        {
            await RunOnPlayerThread(() =>
            {
                if (ActivePlayers.TryGetValue(id, out var player))
                {
                    player.DataPlayer?.Play();
                    player.SendTimeUpdate(false);
                }
            });
        }

        [Command("pauseAudio")]
        public static async Task PauseAudio(string id)
        {
            await RunOnPlayerThread(() =>
            {
                if (ActivePlayers.TryGetValue(id, out var player))
                {
                    player.DataPlayer?.Pause();
                    player.SendTimeUpdate(false);
                }
            });
        }

        [Command("seekAudio")]
        public static async Task SeekAudio(string id, double time)
        {
            await RunOnPlayerThread(() =>
            {
                if (ActivePlayers.TryGetValue(id, out var player) && player.DataReader != null)
                {
                    player.DataReader.CurrentTime = TimeSpan.FromSeconds(Math.Clamp(time, 0, player.DataReader.TotalTime.TotalSeconds - 1));
                    player.SendTimeUpdate(false);
                }
            });
        }

        [Command("setAudioPlayerLoopMode")]
        public static async Task SetAudioPlayerLoopMode(string id, bool loop)
        {
            await RunOnPlayerThread(() =>
            {
                if (ActivePlayers.TryGetValue(id, out var player) && player.DataReader != null)
                {
                    player.Loop = loop;
                }
            });
        }
    }
}
