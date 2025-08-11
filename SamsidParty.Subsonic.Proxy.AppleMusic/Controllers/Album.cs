using Mapster;
using SamsidParty.Subsonic.Common;
using System;
using Newtonsoft.Json;
using System.Dynamic;
using System.Reflection;
using System.Runtime.InteropServices;
using Mapster.Utils;

namespace SamsidParty.Subsonic.Proxy.AppleMusic.Controllers
{
    public partial class AppleMusicRequestImplementation : Subsonic.Common.IController
    {
        public async Task<GetAlbumList2Response> GetAlbumList2Async(AlbumListType type, int size, int offset, int? fromYear, int? toYear, string genre, string musicFolderId)
        {
            var albumList = (await GetAlbumListAsync(type, size, offset, fromYear, toYear, genre, musicFolderId));
            var response = GetDefaultResponse().Adapt<GetAlbumList2SuccessResponse>();
            response.AlbumList2 = albumList.SubsonicResponse.AlbumList;
            return new GetAlbumList2Response() { SubsonicResponse = response };
        }

        // type is ignored cause we can sort client side
        // size is capped to 100 instead of 500 because of apple music API limitations
        // musicFolderId is ignored
        public async Task<GetAlbumListResponse> GetAlbumListAsync(AlbumListType type, int size, int offset, int? fromYear, int? toYear, string genre, string musicFolderId)
        {
            var request = await AppleMusicHttpClient.Instance.SendAsync(new HttpRequestMessage(HttpMethod.Get, $"me/library/albums?limit={Math.Clamp(size, 0, 100)}&offset={offset}").WithMusicKitHeaders());
            var content = await request.Content.ReadAsStringAsync();
            var data = JsonConvert.DeserializeObject<AppleMusic.Types.AlbumResponse>(content);

            if (fromYear > toYear)
            {
                // Swap values
                var temp = fromYear;
                fromYear = toYear;
                toYear = temp;
            }

            var response = GetDefaultResponse().Adapt<GetAlbumListSuccessResponse>();
            response.AlbumList = new AlbumList()
            {
                Album = data.Data.Select((p) =>
                {
                    return p.ToSubsonicType();
                })
                .Where((a) => Math.Clamp(a.Year, fromYear ?? 0, toYear ?? Int32.MaxValue) == a.Year)
                .Where((a) => (!string.IsNullOrEmpty(genre)) ? (a.Genre.ToLower() == genre) : true)
                .ToList()
            };

            return new GetAlbumListResponse() { SubsonicResponse = response };
        }

        public async Task<GetAlbumResponse> GetAlbumAsync(string id)
        {
            var request = await AppleMusicHttpClient.Instance.SendAsync(new HttpRequestMessage(HttpMethod.Get, $"me/library/albums/{id}").WithMusicKitHeaders());
            var content = await request.Content.ReadAsStringAsync();
            var data = JsonConvert.DeserializeObject<AppleMusic.Types.AlbumResponse>(content);
            var p = data!.Data.First();

            var response = GetDefaultResponse().Adapt<GetAlbumSuccessResponse>();
            response.Album = p.ToSubsonicTypeID3().Adapt<Subsonic.Common.AlbumID3WithSongs>();
            response.Album.Song = p.Relationships!.Tracks.Data.Select((AppleMusic.Types.Song s) => s.ToSubsonicType()).ToList();

            return new GetAlbumResponse() { SubsonicResponse = response };
        }
    }
}
