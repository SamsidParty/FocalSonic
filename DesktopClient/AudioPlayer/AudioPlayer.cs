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

        MediaFoundationReader MF;
        WasapiOut WO;

        public AudioPlayer(string id)
        {
            ID = id;
            ActivePlayers.TryAdd(id, this);
        }

        [Command("createAudioPlayer")]
        public static void CreateAudioPlayer(string id)
        {
            var player = new AudioPlayer(id);   
        }

        [Command("setAudioPlayerSource")]
        public static void SetSource(string id, string src)
        {
            if (ActivePlayers.TryGetValue(id, out var player)) {

                if (player.Source == src) { return; } // Already set

                player.Source = src;
                if (!string.IsNullOrEmpty(src))
                {
                    player.MF = new MediaFoundationReader(src);
                    
                    if (player.WO != null)
                    {
                        player.WO.Dispose();
                        player.WO = null;
                    }

                    player.WO = new WasapiOut();
                    player.WO.Init(player.MF);
                }
                else
                {
                    player.MF = null;
                }
            }
        }

        [Command("playAudio")]
        public static void PlayAudio(string id)
        {
            if (ActivePlayers.TryGetValue(id, out var player))
            {
                player.WO?.Play();
            }
        }

        [Command("pauseAudio")]
        public static void PauseAudio(string id)
        {
            if (ActivePlayers.TryGetValue(id, out var player))
            {
                player.WO?.Pause();
            }
        }
    }
}
