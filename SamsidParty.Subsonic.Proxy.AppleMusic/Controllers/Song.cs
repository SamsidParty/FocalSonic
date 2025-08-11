using Mapster;
using Newtonsoft.Json;
using SamsidParty.Subsonic.Common;
using SamsidParty.Subsonic.Proxy.AppleMusic.Types;
using System.Dynamic;

namespace SamsidParty.Subsonic.Proxy.AppleMusic.Controllers
{
    public partial class AppleMusicRequestImplementation : Subsonic.Common.IController
    {
        public async Task<GetSongResponse> GetSongAsync(string id)
        {
            var songID = new SongID(id);
            var catalogID = songID.CatalogID;

            var song = (await AppleMusicHttpClient.SendRequest<SongResponse>($"catalog/{AppleMusicKeys.Region}/songs/{catalogID}"))!.Data.First();
            var response = GetDefaultResponse().Adapt<GetSongSuccessResponse>();
            response.Song = song.ToSubsonicType();

            return new GetSongResponse() { SubsonicResponse = response };
        }
    }
}
