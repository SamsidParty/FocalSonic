using FocalSonic.AppleMusic;
using FocalSonic.LastFM;
using FocalSonic.Windows;
using IgniteView.Core;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FocalSonic.Presence
{
    public class Presence : PresenceProvider
    {
        public static Presence Instance;
        public List<PresenceProvider> Providers = new List<PresenceProvider>();
        public string LastPresenceHash = "";

        public static void Setup()
        {
            Instance = new Presence();
            #if WINDOWS
            Instance.RegisterProvider(new WindowsPresenceProvider());
            #endif
            Instance.RegisterProvider(new DiscordPresenceProvider());
            Instance.RegisterProvider(new AppleMusicPresenceProvider());
            Instance.RegisterProvider(new LastFMPresenceProvider());
        }

        public Presence() { Instance = this; }

        public void RegisterProvider(PresenceProvider provider)
        {
            if (!Providers.Contains(provider))
            {
                Providers.Add(provider);
            }
        }

        public override async Task UpdateMediaStatus(MediaPlaybackInfo playbackInfo)
        {
            if (LastPresenceHash == playbackInfo.PresenceHash) return;
            LastPresenceHash = playbackInfo.PresenceHash;

            foreach (var provider in Providers)
            {
                try
                {
                    provider.UpdateMediaStatus(playbackInfo);
                }
                catch (Exception ex)
                {
                    // Silent fail but log the error for debugging purposes
                    Console.WriteLine($"Error updating media status with provider {provider.GetType().Name}: {ex.Message}");
                }
            }
        }


        public override async Task Scrobble(MediaPlaybackInfo playbackInfo)
        {
            foreach (var provider in Providers)
            {
                try
                {
                    provider.Scrobble(playbackInfo);
                }
                catch (Exception ex) {
                    // Silent fail but log the error for debugging purposes
                    Console.WriteLine($"Error scrobbling with provider {provider.GetType().Name}: {ex.Message}");
                }
            }
        }
    }
}
