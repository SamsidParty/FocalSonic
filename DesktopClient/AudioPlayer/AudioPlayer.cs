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

        MediaFoundationReader? DataReader;
        DirectSoundOut? DataPlayer;
        WebWindow? AssociatedWindow;

        public AudioPlayer(string id)
        {
            ID = id;
            ActivePlayers.TryAdd(id, this);
            SendTimeUpdate();
        }

        public async Task SendTimeUpdate(bool repeat = true)
        {
            if (DataPlayer != null && DataReader != null && AssociatedWindow != null)
            {
                if (DataPlayer.PlaybackState == PlaybackState.Playing)
                {
                    AssociatedWindow.CallFunction("handleAudioEvent_" + ID, "timeupdate", DataReader.CurrentTime.TotalSeconds);
                }

                if (DataReader.TotalTime.Subtract(DataReader.CurrentTime).TotalSeconds < 1 && repeat)
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
                        AssociatedWindow.CallFunction("handleAudioEvent_" + ID, "ended");
                    }
                }
            }

            await Task.Delay(1000);
            if (repeat) SendTimeUpdate();
        }

        // Running this task forces the awaiter to run on a different thread.
        public static async Task ForceMultithreaded()
        {
            await Task.Delay(0);
        }

        [Command("createAudioPlayer")]
        public static async Task CreateAudioPlayer(string id)
        {
            await ForceMultithreaded();
            if (ActivePlayers.ContainsKey(id)) { return; }
            var player = new AudioPlayer(id);   
        }

        [Command("setAudioPlayerSource")]
        public static async Task SetSource(string id, string src, WebWindow ctx)
        {
            await ForceMultithreaded();
            if (ActivePlayers.TryGetValue(id, out var player)) {

                if (player.Source == src) { return; } // Already set

                player.Source = src;
                player.AssociatedWindow = ctx;

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
        }

        [Command("playAudio")]
        public static async Task PlayAudio(string id)
        {
            await ForceMultithreaded();
            if (ActivePlayers.TryGetValue(id, out var player))
            {
                player.DataPlayer?.Play();
                player.SendTimeUpdate(false);
            }
        }

        [Command("pauseAudio")]
        public static async Task PauseAudio(string id)
        {
            await ForceMultithreaded();
            if (ActivePlayers.TryGetValue(id, out var player))
            {
                player.DataPlayer?.Pause();
                player.SendTimeUpdate(false);
            }
        }

        [Command("seekAudio")]
        public static async Task SeekAudio(string id, double time)
        {
            await ForceMultithreaded();
            if (ActivePlayers.TryGetValue(id, out var player) && player.DataReader != null)
            {
                player.DataReader.CurrentTime = TimeSpan.FromSeconds(Math.Clamp(time, 0, player.DataReader.TotalTime.TotalSeconds - 1));
                player.SendTimeUpdate(false);
            }
        }

        [Command("setAudioPlayerLoopMode")]
        public static async Task SetAudioPlayerLoopMode(string id, bool loop)
        {
            await ForceMultithreaded();
            if (ActivePlayers.TryGetValue(id, out var player) && player.DataReader != null)
            {
                player.Loop = loop;
            }
        }
    }
}
