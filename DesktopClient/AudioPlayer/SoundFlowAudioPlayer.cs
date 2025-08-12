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
    public class SoundFlowAudioPlayer : AudioPlayer
    {
        SoundPlayer Player;
        AudioEngine AudioEngine;
        StreamDataProvider DataProvider;
        AudioPlaybackDevice Device;

        static AudioFormat PlaybackFormat = new AudioFormat
        {
            Format = SampleFormat.F32,
            SampleRate = 48000,
            Channels = 2
        };

        public SoundFlowAudioPlayer(string id) : base(id)
        {
            AudioEngine = new MiniAudioEngine();
            Device = AudioEngine.InitializePlaybackDevice(null, PlaybackFormat, new MiniAudioDeviceConfig()
            {
                Wasapi = new WasapiSettings()
                {
                    NoAutoConvertSRC = true,
                    NoDefaultQualitySRC = true,
                    Usage = SoundFlow.Backends.MiniAudio.Enums.WasapiUsage.Default
                }
            });
            Device.Start();
        }

        public override async Task SendTimeUpdate(bool isAutomatic = true)
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


        public override async Task SetSource(string src, WebWindow ctx)
        {
            if (Source == src && Player?.State != PlaybackState.Stopped) { return; } // Already set

            HasLoaded = false;
            Source = src;
            AssociatedWindowID = ctx.ID;

            if (!string.IsNullOrEmpty(src))
            {
                if (Player != null)
                {
                    Device?.MasterMixer?.RemoveComponent(Player);
                    Player?.Stop();
                    Player?.Dispose();
                    DataProvider?.Dispose();
                    Player = null;
                    DataProvider = null;
                }

                DataProvider = new StreamDataProvider(AudioEngine, PlaybackFormat, new SeekableHttpStream(src));
                Player = new SoundPlayer(AudioEngine, PlaybackFormat, DataProvider);
                Device.MasterMixer.AddComponent(Player);

                Player.PlaybackEnded += async (_, _) =>
                {
                    await Task.Delay(1000); // Prevents the audio abrubtly being cut off at the end
                    AssociatedWindow?.CallFunction("handleAudioEvent_" + ID, "ended");
                };

                while (Player?.Duration == 0)
                {
                    await Task.Delay(100);
                }
                if (Player?.Duration > 0)
                {
                    AssociatedWindow?.CallFunction("handleAudioEvent_" + this.ID, "loaded", Player!.Duration);
                    HasLoaded = true;
                }
            }
            else
            {
                Player = null;
            }
        }

        public override async Task PlayAudio()
        {
            Player?.Play();
            SendTimeUpdate(false);
        }

        public override async Task PauseAudio()
        {
            Player?.Pause();
            SendTimeUpdate(false);
        }

        public override async Task SeekAudio(double time)
        {
            if (Player != null)
            {
                Player.Seek((float)Math.Clamp(time, 0, Player.Duration - 1));
                SendTimeUpdate(false);
            }
        }

        public override async Task SetLoopMode(bool loop)
        {
            if (Player != null)
            {
                Player.IsLooping = loop;
            }
        }

        public override async Task SetVolume(double volume)
        {
            if (Player != null)
            {
                Player.Volume = (float)volume;
            }
        }
    }
}
