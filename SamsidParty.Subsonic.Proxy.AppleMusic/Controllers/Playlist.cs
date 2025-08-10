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
            dynamic content = await request.Content.ReadAsStringAsync();
            dynamic data = JsonConvert.DeserializeObject<ExpandoObject>(content);

            var response = GetDefaultResponse().Adapt<GetPlaylistsSuccessResponse>();
            response.Playlists = new Playlists()
            {
                Playlist = ((List<dynamic>)data.data).Select((p) =>
                {
                    return new Playlist()
                    {
                        Id = p.id,
                        Name = p.attributes.name,
                        Public = p.attributes.isPublic,
                        Created = p.attributes.dateAdded,
                        Changed = p.attributes.dateAdded,
                        SongCount = 0,
                        Duration = 0,
                    };
                }).ToList()
            };



            return new GetPlaylistsResponse()
            {
                SubsonicResponse = response,
            };
        }
    }
}
