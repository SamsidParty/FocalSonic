using Aonsoku.Presence;
using IgniteView.Core;
using SoundFlow.Abstracts;
using SoundFlow.Abstracts.Devices;
using SoundFlow.Backends.MiniAudio;
using SoundFlow.Backends.MiniAudio.Devices;
using SoundFlow.Components;
using SoundFlow.Enums;
using SoundFlow.Providers;
using SoundFlow.Structs;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
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
        public bool HasLoaded;

        SoundPlayer Player;
        AudioEngine AudioEngine;
        StreamDataProvider DataProvider;
        AudioPlaybackDevice Device;

        int AssociatedWindowID;
        WebWindow? AssociatedWindow => AppManager.Instance.OpenWindows.Where((w) => w.ID == AssociatedWindowID).FirstOrDefault();

        static AudioFormat PlaybackFormat = new AudioFormat
        {
            Format = SampleFormat.F32,
            SampleRate = 48000,
            Channels = 2
        };

        [SetsRequiredMembers]
        public AudioPlayer(string id)
        {
            ID = id;
            AudioEngine = new MiniAudioEngine();
            Device = AudioEngine.InitializePlaybackDevice(AudioEngine.PlaybackDevices.FirstOrDefault(d => d.IsDefault), PlaybackFormat, new MiniAudioDeviceConfig()
            {
                Wasapi = new WasapiSettings()
                {
                    NoAutoConvertSRC = true,
                    NoDefaultQualitySRC = true,
                    Usage = SoundFlow.Backends.MiniAudio.Enums.WasapiUsage.Default
                }
            });
            Device.Start();

            ActivePlayers.TryAdd(id, this);
        }

        public async Task SendTimeUpdate(bool isAutomatic = true)
        {
            if (Player != null && DataProvider != null)
            {
                if (Player.State == PlaybackState.Playing)
                {
                    AssociatedWindow?.CallFunction("handleAudioEvent_" + ID, "timeupdate", Player.Time);
                }

                MediaPlaybackInfo.Instance.IsPlaying = Player?.State == PlaybackState.Playing;
                MediaPlaybackInfo.Instance.Duration = TimeSpan.FromSeconds(Player?.Duration ?? 0);
                MediaPlaybackInfo.Instance.Position = TimeSpan.FromSeconds(Player?.Time ?? 0);
            }
            Presence.Presence.Instance.UpdateMediaStatus(MediaPlaybackInfo.Instance);
        }

        // We need to run all functions on the player thread for the following reasons:
        // 1. Prevents freezing and stuttering the UI
        // 2. Ensures that the WebWindow is properly garbage collected while the player is still running
        public static async Task RunOnPlayerThread(Action f)
        {
            PlayerThread.ActionQueue.Enqueue(f);
        }

        [Command("createAudioPlayer")]
        public static async Task CreateAudioPlayer(string id, WebWindow ctx)
        {
            await RunOnPlayerThread(() =>
            {
                if (ActivePlayers.TryGetValue(id, out var existingPlayer)) {
                    existingPlayer.AssociatedWindowID = ctx.ID; // Associate the player with the window
                    return;
                }
                var player = new AudioPlayer(id);
            });
        }

        [Command("setAudioPlayerSource")]
        public static async Task SetSource(string id, string src, WebWindow ctx)
        {

            await RunOnPlayerThread(async () =>
            {
                if (ActivePlayers.TryGetValue(id, out var player))
                {

                    if (player.Source == src && player.Player?.State != PlaybackState.Stopped) { return; } // Already set

                    player.HasLoaded = false;
                    player.Source = src;
                    player.AssociatedWindowID = ctx.ID;

                    if (!string.IsNullOrEmpty(src))
                    {
                        if (player.Player != null)
                        {
                            player.Device?.MasterMixer?.RemoveComponent(player.Player);
                            player.Player?.Stop();
                            player.Player?.Dispose();
                            player.DataProvider?.Dispose();
                            player.Player = null;
                            player.DataProvider = null;
                        }

                        player.DataProvider = new StreamDataProvider(player.AudioEngine, PlaybackFormat, new SeekableHttpStream(src));
                        player.Player = new SoundPlayer(player.AudioEngine, PlaybackFormat, player.DataProvider);
                        player.Device.MasterMixer.AddComponent(player.Player);

                        player.Player.PlaybackEnded += (_, _) =>
                        {
                            player.AssociatedWindow?.CallFunction("handleAudioEvent_" + player.ID, "ended");
                        };

                        while (player.Player?.Duration == 0)
                        {
                            await Task.Delay(100);
                        }
                        if (player.Player?.Duration > 0)
                        {
                            player.AssociatedWindow?.CallFunction("handleAudioEvent_" + id, "loaded", player.Player!.Duration);
                            player.HasLoaded = true;
                        }
                    }
                    else
                    {
                        player.Player = null;
                    }
                }
            });
        }

        [Command("playAudio")]
        public static async Task PlayAudio(string id)
        {
            await RunOnPlayerThread(async () =>
            {
                if (ActivePlayers.TryGetValue(id, out var player))
                {
                    player.Player?.Play();
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
                    player.Player?.Pause();
                    player.SendTimeUpdate(false);
                }
            });
        }

        [Command("seekAudio")]
        public static async Task SeekAudio(string id, double time)
        {
            await RunOnPlayerThread(() =>
            {
                if (ActivePlayers.TryGetValue(id, out var player) && player.Player != null)
                {
                    player.Player.Seek((float)Math.Clamp(time, 0, player.Player.Duration - 1));
                    player.SendTimeUpdate(false);
                }
            });
        }

        [Command("setAudioPlayerLoopMode")]
        public static async Task SetAudioPlayerLoopMode(string id, bool loop)
        {
            await RunOnPlayerThread(() =>
            {
                if (ActivePlayers.TryGetValue(id, out var player) && player.Player != null)
                {
                    player.Player.IsLooping = loop;
                }
            });
        }
    }
}
