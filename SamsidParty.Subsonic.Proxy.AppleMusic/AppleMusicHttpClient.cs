using Newtonsoft.Json;
using SamsidParty.Subsonic.Proxy.AppleMusic.Types;

namespace SamsidParty.Subsonic.Proxy.AppleMusic
{
    public class AppleMusicHttpClient : HttpClient
    {
        public static AppleMusicHttpClient Instance = new AppleMusicHttpClient();

        public AppleMusicHttpClient()
        {
            this.BaseAddress = new Uri("https://amp-api.music.apple.com/v1/");
        }

        public static async Task<T> SendRequest<T>(string url)
        {
            var request = await Instance.SendAsync(new HttpRequestMessage(HttpMethod.Get, url.Replace("{storefront}", AppleMusicKeys.Region)).WithMusicKitHeaders());
            var content = await request.Content.ReadAsStringAsync();
            var data = JsonConvert.DeserializeObject<T>(content);
            return data;
        }

    }
}
