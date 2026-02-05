using FocalSonic.Presence;
using GoogleCast;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Security.Policy;
using System.Text;
using System.Threading.Tasks;

namespace FocalSonic.AppleMusic
{
    public class AppleMusicPresenceProvider : PresenceProvider
    {
        public override async Task UpdateMediaStatus(MediaPlaybackInfo playbackInfo) { }
        public override async Task Scrobble(MediaPlaybackInfo playbackInfo) {

            return; // Ts lowkey too hard ill do it later

            if (playbackInfo.CurrentSong != null && AudioPlayer.AudioPlayer.Instance is AppleMusicAudioPlayer)
            {
                var client = AppleMusicHttpClient.Instance;
                var isEnd = true;

                var obj = new Dictionary<string, object>
                {
                    ["client_id"] = "JSCLIENT",
                    ["event_type"] = "JSPLAY",
                    ["data"] = new List<object>
                    {
                        new Dictionary<string, object>
                        {
                            ["build-version"] = "AppleMusic/1.0 Unidentified OS/0.0 model/Win32 build/2444.4.0-external",
                            ["container-ids"] = new Dictionary<string, object>
                            {
                                [int.TryParse(playbackInfo.CurrentSong.AlbumId, out _) ? "album-adam-id" : "cloud-album-id"] = playbackInfo.CurrentSong.AlbumId
                            },
                            ["container-type"] = 3,
                            ["developer-token"] = AppleMusicKeys.AppleDeveloperToken,
                            ["event-reason-hint-type"] = isEnd ? 5 : 1,
                            ["event-type"] = isEnd ? 0 : 1,
                            ["feature-name"] = "album",
                            ["ids"] = new Dictionary<string, object>
                            {
                                ["subscription-adam-id"] = playbackInfo.CurrentSong.Id
                            },
                            ["internal-build"] = false,
                            ["media-duration-in-milliseconds"] = playbackInfo.Duration.TotalMilliseconds,
                            ["media-type"] = 0,
                            ["offline"] = false,
                            ["persistent-id"] = playbackInfo.PresenceHash,
                            ["private-enabled"] = false,
                            ["sb-enabled"] = true,
                            ["siri-initiated"] = false,
                            ["source-type"] = 24,
                            ["start-position-in-milliseconds"] = 0,
                            ["store-front"] = AppleMusicKeys.Region,
                            ["type"] = 1,
                            ["user-agent"] = "FocalSonic by SamsidParty",
                            ["user-token"] = AppleMusicKeys.MediaUserToken,
                            ["utc-offset-in-seconds"] = 0,
                            ["milliseconds-since-play"] = isEnd ? 30000 : 1
                        }
                    }
                };

                var msg = new HttpRequestMessage(HttpMethod.Post, "https://universal-activity-service.itunes.apple.com/play");
                msg.Content = new StringContent(System.Text.Json.JsonSerializer.Serialize(obj), Encoding.UTF8, "application/json");

                var result = await client.SendAsync(msg.WithMusicKitHeaders());
                var data = await result.Content.ReadAsStringAsync();
                Console.WriteLine(data);
            }
        }
    }
}
