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

        public static async Task<T> SendRequest<T>(string url) where T : class
        {
            try
            {
                var request = await Instance.SendAsync(new HttpRequestMessage(HttpMethod.Get, url.Replace("{storefront}", AppleMusicKeys.Region)).WithMusicKitHeaders());
                var content = await request.Content.ReadAsStringAsync();
                T data;

                if (typeof(T) == typeof(string))
                {
                    data = (content as T)!;
                }
                else
                {
                    data = JsonConvert.DeserializeObject<T>(content);
                }


                if (!request.IsSuccessStatusCode)
                {
                    throw new Exception(content);
                }

                return data;
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Apple Music API request to {url} failed: {ex.ToString()}");
                return null;
            }
        }

    }
}
