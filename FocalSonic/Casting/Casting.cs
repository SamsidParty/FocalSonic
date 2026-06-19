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

        static string CurrentDeviceType = "";
        static AirPlay.AirPlaySession? CurrentAirPlay;

        [Command("disconnectCast")]
        public static void HandleDisconnect()
        {
            // Chromecast teardown
            try { MediaChannel?.StopAsync(); } catch { }
            try { Client?.Disconnect(); } catch { }
            Client = null;

            // AirPlay teardown
            try { CurrentAirPlay?.Stop(); } catch { }
            CurrentAirPlay = null;

            // Back to "local" restores the playback gain (un-mutes the PC speakers).
            AudioPlayer.AudioPlayer.Instance?.SetOutputDevice("local");
            LastSongID = "";
            IsPlaying = false;
            CurrentDeviceID = "";
            CurrentDeviceType = "";
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

        // Lets the frontend tell AirPlay (direct capture — keep local effects/volume)
        // apart from Chromecast (remote playback — hide local controls).
        [Command("getCastDeviceType")]
        public static string GetCastDeviceType() => CurrentDeviceType;

        [Command("getCastDevices")]
        public static async Task<List<CastDeviceReference>> GetAvailableDevices()
        {
            var devices = new List<CastDeviceReference>();

            try { devices.AddRange(await GetChromecastDevices()); } catch { }

            // Only advertise AirPlay if the streaming module is actually available
            // (it never is in production until the bundler is configured).
            if (AirPlay.AirPlaySession.IsAvailable)
            {
                try { devices.AddRange(await AirPlay.AirPlayDiscovery.ScanAsync()); } catch { }
            }

            return devices;
        }

        static async Task<List<CastDeviceReference>> GetChromecastDevices()
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

            var device = CastDeviceReference.GetByID(referenceID);
            if (device == null) return "device-not-found";

            if (device.Type == "airplay")
            {
                return await StartAirPlay(device);
            }

            return await StartChromecast(device);
        }

        static async Task<string> StartAirPlay(CastDeviceReference device)
        {
            if (!AirPlay.AirPlaySession.IsAvailable) return "airplay-unavailable";

            CurrentDeviceID = device.ReferenceID;
            CurrentDeviceType = "airplay";

            // "airplay" keeps playback local but drops the gain to ~1e-6; the AirPlay
            // module captures that near-silent signal and restores it before streaming.
            await AudioPlayer.AudioPlayer.Instance?.SetOutputDevice("airplay");

            CurrentAirPlay = new AirPlay.AirPlaySession();
            CurrentAirPlay.OnExited = () => HandleDisconnect();

            var started = CurrentAirPlay.Start(device, Environment.ProcessId);
            if (!started)
            {
                HandleDisconnect();
                return "failed";
            }

            return "success";
        }

        static async Task<string> StartChromecast(CastDeviceReference chromecast)
        {
            CurrentDeviceType = "chromecast";

            try
            {
                var channel = new FocalSonicChannel();
                var service = new ServiceCollection().AddGoogleCast();
                service.AddTransient(typeof(IChannel), typeof(FocalSonicChannel));

                CurrentDeviceID = chromecast.ReferenceID;
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
