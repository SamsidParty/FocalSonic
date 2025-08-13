using Mapster;
using SamsidParty.Subsonic.Common;
using System;
using Newtonsoft.Json;
using System.Dynamic;
using System.Reflection;
using System.Runtime.InteropServices;
using SamsidParty.Subsonic.Proxy.AppleMusic.Types;

namespace SamsidParty.Subsonic.Proxy.AppleMusic.Controllers
{
    public partial class AppleMusicRequestImplementation : Subsonic.Common.IController
    {
        public async Task<GetPlaylistsResponse> GetPlaylistsAsync(string username) // username should be ignored because it's only for admins
        {
            var data = await AppleMusicHttpClient.SendRequest<PlaylistResponse>("me/library/playlists");

            var response = GetDefaultResponse().Adapt<GetPlaylistsSuccessResponse>();
            response.Playlists = new Playlists()
            {
                Playlist = data.Data.Select((p) => p.ToSubsonicType()).ToList()
            };

            return new GetPlaylistsResponse() { SubsonicResponse = response };
        }

        public async Task<GetPlaylistResponse> GetPlaylistAsync(string id)
        {
            AppleMusic.Types.Playlist p;
            try
            {
                p = (await AppleMusicHttpClient.SendRequest<PlaylistResponse>($"me/library/playlists/{id}?include=tracks"))!.Data.First();
            }
            catch
            {
                p = (await AppleMusicHttpClient.SendRequest<PlaylistResponse>($"catalog/{AppleMusicKeys.Region}/playlists/{id}?include=tracks"))!.Data.First();
            }

            var response = GetDefaultResponse().Adapt<GetPlaylistSuccessResponse>();
            response.Playlist = p.ToSubsonicType().Adapt<Subsonic.Common.PlaylistWithSongs>();
            response.Playlist.Entry = p.Relationships!.Tracks.Data.Select((AppleMusic.Types.Song s) => s.ToSubsonicType()).ToList();

            return new GetPlaylistResponse() { SubsonicResponse = response };
        }
    }
}
