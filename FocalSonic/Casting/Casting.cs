using FocalSonic.AppleMusic;
using FocalSonic.AudioPlayer;
using FocalSonic.Presence;
using GoogleCast;
using GoogleCast.Channels;
using GoogleCast.Messages;
using GoogleCast.Models.Media;
using IgniteView.Core;
using Microsoft.Extensions.DependencyInjection;
using Newtonsoft.Json;
using SamsidParty.Subsonic.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.NetworkInformation;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Controls;
using Windows.Media.Protection.PlayReady;
using static System.Windows.Forms.VisualStyles.VisualStyleElement;

namespace FocalSonic.Casting
{

    public class Casting
    {
        public const string Namespace = "urn:x-cast:com.samsidparty.focalsonic";

        static string LastSongID = "";

        static DeviceLocator _Locator;
        static DeviceLocator Locator
        {
            get
            {
                if (_Locator == null)
                {
                    _Locator = new DeviceLocator();
                }
                return _Locator;
            }
        }

        static Sender? Client;
        static IMediaChannel? MediaChannel;

        public static void HandleDisconnect()
        {
            try { Client?.Disconnect(); } catch { }
            AudioPlayer.AudioPlayer.Instance?.SetOutputDevice("local");
            LastSongID = "";
            Client = null;
        }

        public static async Task Send(CastMessage message)
        {
            if (Client == null) return;
            if (MediaChannel == null) return;

            // I couldn't get custom channels working so this is the workaround method
            await MediaChannel.LoadAsync(message.ToVirtualLoadMessage());
        }

        [Command("getCastDevices")]
        public static async Task<List<CastDeviceReference>> GetAvailableDevices()
        {
            try
            {
                var interfaces = NetworkInterface.GetAllNetworkInterfaces();
                NetworkInterface primaryInterface = null;

                foreach (var ni in interfaces)
                {
                    if (ni.OperationalStatus != OperationalStatus.Up) continue;
                    if (ni.NetworkInterfaceType == NetworkInterfaceType.Loopback) continue;
                    if (ni.NetworkInterfaceType == NetworkInterfaceType.Tunnel) continue;
                    if (ni.IsReceiveOnly) continue;

                    IPInterfaceProperties adapterProperties = ni.GetIPProperties();
                    GatewayIPAddressInformationCollection gatewayAddresses = adapterProperties.GatewayAddresses;

                    if (gatewayAddresses.Where((addr) => addr.Address.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork).Count() > 0)
                    {
                        primaryInterface = ni;
                        break;
                    }
                }

                if (primaryInterface == null) primaryInterface = interfaces.FirstOrDefault();
                if (primaryInterface == null) return new List<CastDeviceReference>();

                var chromecasts = await Locator.FindReceiversAsync(primaryInterface);
                return chromecasts.Select((d) => CastDeviceReference.Get(d)).ToList();
            }
            catch
            {
                return new List<CastDeviceReference>();
            }
        }

        [Command("startCasting")]
        public static async Task<string> StartCasting(string referenceID)
        {
            HandleDisconnect();

            var chromecast = CastDeviceReference.GetByID(referenceID);
            if (chromecast == null) return "device-not-found";

            try
            {
                var channel = new FocalSonicChannel();
                var service = new ServiceCollection().AddGoogleCast();
                service.AddTransient(typeof(IChannel), typeof(FocalSonicChannel));

                Client = new Sender(service.BuildServiceProvider());
                Client.Disconnected += (_, _) => HandleDisconnect();
                MediaChannel = Client?.GetChannel<IMediaChannel>();

                await Client.ConnectAsync(chromecast.Receiver);
                await Client.LaunchAsync(channel);


                AudioPlayer.AudioPlayer.Instance?.SetOutputDevice("chromecast");

                await LoadMedia(null); 
                await AudioPlayer.AudioPlayer.Instance?.PlayAudio();

                return "success";
            }
            catch { }

            return "failed";
        }

        public static async Task LoadMedia(string? songID)
        {
            if (string.IsNullOrEmpty(songID))
            {
                songID = MediaPlaybackInfo.Instance?.Store?.State?.SongList?.CurrentSong?.Id;
            }


            if (string.IsNullOrEmpty(songID)) return;
            if (Client == null) return;
            if (songID == LastSongID) return;
            LastSongID = songID;

            await Send(new CastMessage("setSource", "applemusic", AudioPlayer.AudioPlayer.Instance.ChromecastCredential, songID));
        }

        public static async Task PauseMedia()
        {
            if (Client == null) return;
            await Send(new CastMessage("pause"));
        }

        public static async Task PlayMedia()
        {
            if (Client == null) return;
            await Send(new CastMessage("play"));
        }
    }
}
