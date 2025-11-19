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
using SamsidParty.Subsonic.Common.Types;
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
        static string CurrentDeviceID = "";
        static bool IsPlaying = false;

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

        [Command("disconnectCast")]
        public static void HandleDisconnect()
        {
            try { MediaChannel?.StopAsync(); } catch { }
            try { Client?.Disconnect(); } catch { }
            AudioPlayer.AudioPlayer.Instance?.SetOutputDevice("local");
            LastSongID = "";
            IsPlaying = false;
            CurrentDeviceID = "";
            Client = null;
        }

        public static async Task Send(CastMessage message)
        {
            if (Client == null) return;
            if (MediaChannel == null) return;

            // I couldn't get custom channels working so this is the workaround method
            try
            {
                await MediaChannel.LoadAsync(message.ToVirtualLoadMessage());
            }
            catch { }
        }

        public static async Task HandleStatusUpdate(CastMessage incomingMessage)
        {
            // Schedule the next status update request
            _ = Task.Run(async () =>
            {
                if (Client != null)
                {
                    try
                    {
                        await Task.Delay(700);
                        await Send(new CastMessage("ping"));
                    }
                    catch { }
                }
            });

            if (incomingMessage.Type == "ok")
            {
                var songID = incomingMessage.Data[0];
                var syncTime = long.Parse(incomingMessage.Data[1]); // Unix timestamp in milliseconds of when currentTime was set
                var currentTime = double.Parse(incomingMessage.Data[2]); // The time of the playback head

                // Offset the current time based on the latency of the message
                // Latency is calculated by taking the current time and subtracting the syncTime
                var latency = (DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() - syncTime) / 1000.0;
                // currentTime += latency; // For some reason adding the latency makes the desync worse 

                // Send the time update
                AudioPlayer.AudioPlayer.Instance?.HandleTimeUpdate(IsPlaying, currentTime, -1, "chromecast");
            }
        }

        [Command("getCastStatus")]
        public static string GetCastStatus() => CurrentDeviceID;

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

                CurrentDeviceID = referenceID;
                Client = new Sender(service.BuildServiceProvider());
                Client.Disconnected += (_, _) => HandleDisconnect();
                MediaChannel = Client?.GetChannel<IMediaChannel>();
                MediaChannel.StatusChanged += (_, _) =>
                {
                    var newStatus = MediaChannel.Status;

                    if ((newStatus?.Any() ?? false) && newStatus.First().Media?.ContentType == "focalsonic/virtual-response")
                    {
                        var message = JsonConvert.DeserializeObject<CastMessage>(newStatus.First().Media!.ContentId);
                        try
                        {
                            HandleStatusUpdate(message);
                        }
                        catch { }
                    }
                };

                await Client.ConnectAsync(chromecast.Receiver);
                await Client.LaunchAsync(channel);

                await Send(new CastMessage("setCredentials", "applemusic", AudioPlayer.AudioPlayer.Instance.ChromecastCredential));


                await AudioPlayer.AudioPlayer.Instance?.SetOutputDevice("chromecast");
                await LoadMedia(null);
                await AudioPlayer.AudioPlayer.Instance?.SetSpeed(1); // Prevent desync
                await AudioPlayer.AudioPlayer.Instance?.PlayAudio();

                return "success";
            }
            catch { }

            HandleDisconnect();
            return "failed";
        }

        public static async Task LoadMedia(string? songID)
        {
            var seekTime = 0d;
            if (string.IsNullOrEmpty(songID))
            {
                songID = MediaPlaybackInfo.Instance?.Store?.State?.SongList?.CurrentSong?.Id;
                seekTime = MediaPlaybackInfo.Instance.Position.TotalSeconds;
            }


            if (string.IsNullOrEmpty(songID)) return;
            if (Client == null) return;
            if (songID == LastSongID) return;
            LastSongID = songID;
            IsPlaying = true;

            await Send(new CastMessage("setSource", songID, seekTime.ToString()));
        }

        public static async Task PauseMedia()
        {
            if (Client == null || !IsPlaying) return;

            IsPlaying = false;
            await Send(new CastMessage("pause"));
        }

        public static async Task PlayMedia()
        {
            if (Client == null || IsPlaying) return;

            IsPlaying = true;
            await Send(new CastMessage("play"));
        }

        public static async Task SeekMedia(double seekTime)
        {
            if (Client == null || !IsPlaying) return;

            await Send(new CastMessage("seek", seekTime.ToString()));
        }
    }
}
