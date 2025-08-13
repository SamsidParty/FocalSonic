using Mapster;
using Newtonsoft.Json;
using SamsidParty.Subsonic.Common;
using SamsidParty.Subsonic.Proxy.AppleMusic.Types;
using System.Dynamic;

namespace SamsidParty.Subsonic.Proxy.AppleMusic.Controllers
{
    public partial class AppleMusicRequestImplementation : Subsonic.Common.IController
    {
        // The client should send the song ID instead of the title
        public async Task<GetLyricsResponse> GetLyricsAsync(string artist, string title)
        {
            var catalogID = new SongID(title).CatalogID;
            dynamic data = (await AppleMusicHttpClient.SendRequest<ExpandoObject>($"catalog/{AppleMusicKeys.Region}/songs/{catalogID}/syllable-lyrics?l=en-US"));
            var lyrics = data.data[0].attributes.ttml;

            var response = GetDefaultResponse().Adapt<GetLyricsSuccessResponse>();
            response.Lyrics = new Lyrics()
            {
                Value = lyrics
            };

            return new GetLyricsResponse() { SubsonicResponse = response };
        }
    }
}
