using System.Net.Http;

namespace FocalSonic.AppleMusic
{
    public static class AppleMusicHttpExtensions
    {
        public static HttpRequestMessage WithMusicKitHeaders(this HttpRequestMessage request) {

            request.Headers.Add("Authorization", $"Bearer {AppleMusicKeys.AppleDeveloperToken}");
            request.Headers.Add("Media-User-Token", AppleMusicKeys.MediaUserToken);
            request.Headers.Add("DNT", "1");
            request.Headers.Add("authority", "amp-api.music.apple.com");
            request.Headers.Add("origin", "https://beta.music.apple.com");
            request.Headers.Add("referer", "https://beta.music.apple.com");
            request.Headers.Add("sec-fetch-dest", "empty");
            request.Headers.Add("sec-fetch-mode", "cors");
            request.Headers.Add("sec-fetch-site", "same-site");
            return request;
        }
    }
}
