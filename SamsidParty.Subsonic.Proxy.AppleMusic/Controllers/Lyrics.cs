using Mapster;
using Newtonsoft.Json;
using SamsidParty.Subsonic.Common;
using System.Dynamic;

namespace SamsidParty.Subsonic.Proxy.AppleMusic.Controllers
{
    public partial class AppleMusicRequestImplementation : Subsonic.Common.IController
    {
        // The client should send the ID instead of the title
        public async Task<GetLyricsResponse> GetLyricsAsync(string artist, string title)
        {
            var request = await AppleMusicHttpClient.Instance.SendAsync(new HttpRequestMessage(HttpMethod.Get, $"catalog/{AppleMusicKeys.Region}/songs/{title}/syllable-lyrics?l=en-US").WithMusicKitHeaders());
            var content = await request.Content.ReadAsStringAsync();
            dynamic data = JsonConvert.DeserializeObject<ExpandoObject>(content);
            var lyrics = data!.data[0].attributes.ttml;

            var response = GetDefaultResponse().Adapt<GetLyricsSuccessResponse>();
            response.Lyrics = new Lyrics()
            {
                Value = lyrics
            };

            return new GetLyricsResponse() { SubsonicResponse = response };
        }
    }
}
