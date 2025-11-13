using DiscordRPC;
using SamsidParty.Subsonic.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FocalSonic.Presence
{
    public class DiscordPresenceProvider : PresenceProvider
    {
        public DiscordRpcClient Client;


        /// <summary>
        /// Set to false if the initialization fails because discord is either closed or not installed
        /// </summary>
        public bool IsAvailable;

        //TODO: Allow the user to use their own app ID
        public static string DiscordAppID = "1332231131336282125";

        public DiscordPresenceProvider()
        {
            Initialize();
        }

        public void Initialize()
        {
            try
            {
                if (Client != null)
                {
                    Client.Dispose();
                }

                Client = new DiscordRpcClient(DiscordAppID);
                Client.Initialize();
                Client.SkipIdenticalPresence = true;

                if (!Client.IsInitialized) throw new Exception("Discord isn't available");

                IsAvailable = true;
            }
            catch
            {
                IsAvailable = false;    
            }
        }

        public override async Task UpdateMediaStatus(MediaPlaybackInfo playbackInfo)
        {

            if (
                !IsAvailable || 
                playbackInfo?.CurrentSong == null || 
                string.IsNullOrEmpty(playbackInfo.CurrentSong?.Title) || 
                !playbackInfo.IsPlaying ||
                (!playbackInfo?.Store?.ExtraProperties?.EnableDiscordPresence ?? true)
            )
            {
                if (Client?.CurrentPresence != null) Client.ClearPresence();
                return;
            }

            var limitStringLength = (string s) => s.Length > 128 ? s.Substring(0, 125) + "..." : s;

            var artURL = playbackInfo.Store?.ExtraProperties.GetCoverArtForSong(playbackInfo.CurrentSong?.CoverArt!);

            Client.SetPresence(new RichPresence()
            {
                Type = ActivityType.Listening,
                StatusDisplay = StatusDisplayType.State,
                Details = limitStringLength(playbackInfo.CurrentSong?.Title),
                State = limitStringLength(string.Join(", ", playbackInfo.CurrentSong?.Artists?.Select((a) => a.Name) ?? new string[] { playbackInfo.CurrentSong?.Artist ?? "" })),
                Timestamps = (playbackInfo.IsPlaying && playbackInfo.AssociatedPlayer?.Speed == 1) ? new DiscordRPC.Timestamps()
                {
                    Start = DateTime.UtcNow - playbackInfo.Position,
                    End = playbackInfo.Duration == TimeSpan.Zero ? (DateTime?)null : DateTime.UtcNow + (playbackInfo.Duration - playbackInfo.Position)
                } : null,
                Assets = new Assets()
                {
                    LargeImageKey = artURL.Length > 256 ? "" : artURL,
                    LargeImageText = limitStringLength(playbackInfo.CurrentSong?.Album),
                    SmallImageKey = "https://ipcdn-web.apple.com/assets/v2/web/0c7ea4c6-228d-4fae-a2c4-c36027c6075a",
                    SmallImageText = "FocalSonic",
                    SmallImageUrl = "https://music.apple.com/"
                }
            });
        }
    }
}
