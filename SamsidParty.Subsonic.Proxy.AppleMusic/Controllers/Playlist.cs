using Mapster;
using SamsidParty.Subsonic.Common;
using System;
using Newtonsoft.Json;
using System.Dynamic;
using System.Reflection;
using System.Runtime.InteropServices;

namespace SamsidParty.Subsonic.Proxy.AppleMusic.Controllers
{
    public partial class AppleMusicRequestImplementation : Subsonic.Common.IController
    {
        public async Task<GetPlaylistsResponse> GetPlaylistsAsync(string username) // username should be ignored because it's only for admins
        {
            var request = await AppleMusicHttpClient.Instance.SendAsync(new HttpRequestMessage(HttpMethod.Get, "me/library/playlists").WithMusicKitHeaders());
            var content = await request.Content.ReadAsStringAsync();
            var data = JsonConvert.DeserializeObject<AppleMusic.Types.PlaylistResponse>(content);

            var response = GetDefaultResponse().Adapt<GetPlaylistsSuccessResponse>();
            response.Playlists = new Playlists()
            {
                Playlist = data.Data.Select((p) =>
                {
                    return p.ToSubsonicType();
                }).ToList()
            };

            return new GetPlaylistsResponse() { SubsonicResponse = response };
        }
        public async Task<GetPlaylistResponse> GetPlaylistAsync(string id)
        {
            var request = await AppleMusicHttpClient.Instance.SendAsync(new HttpRequestMessage(HttpMethod.Get, $"me/library/playlists/{id}?include=tracks").WithMusicKitHeaders());
            var content = await request.Content.ReadAsStringAsync();
            var data = JsonConvert.DeserializeObject<AppleMusic.Types.PlaylistResponse>(content);
            var p = data.Data.First();

            var response = GetDefaultResponse().Adapt<GetPlaylistSuccessResponse>();
            response.Playlist = p.ToSubsonicType().Adapt<Subsonic.Common.PlaylistWithSongs>();

            return new GetPlaylistResponse() { SubsonicResponse = response };
        }
    }
}
