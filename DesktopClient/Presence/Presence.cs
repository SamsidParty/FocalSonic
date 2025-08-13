using IgniteView.Core;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Aonsoku.Presence
{
    public class Presence : PresenceProvider
    {
        public static Presence Instance;
        public List<PresenceProvider> Providers = new List<PresenceProvider>();


        public static void Setup()
        {
            Instance = new Presence();
            #if WINDOWS
            Instance.RegisterProvider(new WindowsPresenceProvider());
            #endif
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
            foreach (var provider in Providers)
            {
                provider.UpdateMediaStatus(playbackInfo);
            }
        }
    }
}
