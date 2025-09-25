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

        //TODO: Allow the user to use their own app ID
        public static string DiscordAppID = "1332231131336282125";

        public DiscordPresenceProvider()
        {
            Initialize();
        }

        public void Initialize()
        {
            if (Client != null)
            {
                Client.Dispose();
            }

            Client = new DiscordRpcClient(DiscordAppID);
            Client.Initialize();
        }

        public override async Task UpdateMediaStatus(MediaPlaybackInfo playbackInfo)
        {
            if (playbackInfo?.CurrentSong == null || string.IsNullOrEmpty(playbackInfo.CurrentSong?.Title))
            {
                Client.ClearPresence();
                return;
            }

            Client.SetPresence(new RichPresence()
            {
                Type = ActivityType.Listening,
                Details = playbackInfo.CurrentSong?.Title,
                State = string.Join(", ", playbackInfo.CurrentSong?.Artists?.Select((a) => a.Name) ?? new string[] { playbackInfo.CurrentSong?.Artist ?? "" }),
                Timestamps = playbackInfo.IsPlaying ? new DiscordRPC.Timestamps()
                {
                    Start = DateTime.UtcNow - playbackInfo.Position,
                    End = playbackInfo.Duration == TimeSpan.Zero ? (DateTime?)null : DateTime.UtcNow + (playbackInfo.Duration - playbackInfo.Position)
                } : null,
                Assets = new Assets()
                {
                    LargeImageUrl = playbackInfo.Store?.ExtraProperties.GetCoverArtForSong(playbackInfo.CurrentSong?.CoverArt!),
                    SmallImageUrl = playbackInfo.Store?.ExtraProperties.GetCoverArtForSong(playbackInfo.CurrentSong?.CoverArt!),
                }
            });
        }
    }
}
