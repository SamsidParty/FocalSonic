using SamsidParty.Subsonic.Common;
using SamsidParty.Subsonic.Common.Types;
using System;
using System.Collections.Generic;
using System.Dynamic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static System.Runtime.InteropServices.JavaScript.JSType;
using System.Windows;
using System.Security.Policy;
using Newtonsoft.Json;
using System.Net.Http;
using FocalSonic.Helpers;
using Newtonsoft.Json.Converters;

namespace FocalSonic.AppleMusic
{
    public class AppleMusicRadioResolver
    {
        public static async Task<Song> GetNextTrack(string radioId)
        {
            try
            {
                var request = await AppleMusicHttpClient.Instance.SendAsync(new HttpRequestMessage(HttpMethod.Post, $"me/stations/next-tracks/{radioId}?limit=1").WithMusicKitHeaders());
                var content = await request.Content.ReadAsStringAsync();
                dynamic response = JsonConvert.DeserializeObject<ExpandoObject>(content)!;
                dynamic song = response?.data[0]!;
                return new Song()
                {
                    IsDir = false,
                    Id = song.attributes?.playParams?.id,
                    Parent = song.attributes?.playParams?.id,
                    AlbumId = song.attributes?.playParams?.id,
                    Title = song.attributes?.name ?? "Unknown",
                    Artist = song.attributes?.artistName ?? "Unknown",
                    Album = song.attributes?.albumName ?? "Unknown",
                    Duration = (int)Math.Ceiling((double)((song.attributes?.durationInMillis ?? 0) / 1000)),
                    Suffix = "m4a",
                    CoverArt = song.attributes?.artwork?.url ?? "",
                    Starred = DateTimeOffset.MinValue,
                };
            }
            catch (Exception ex) {
                Console.WriteLine($"Failed to get next track for radio {radioId}: {ex.Message}");
            }

            return null;
        }
    }
}
