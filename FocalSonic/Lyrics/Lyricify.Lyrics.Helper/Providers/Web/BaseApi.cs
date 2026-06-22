using Newtonsoft.Json;
using System.Text;

namespace Lyricify.Lyrics.Providers.Web
{
    public abstract class BaseApi
    {
        public static HttpClient HttpClient = new();

        public const string UserAgent = "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36";

        public const string Cookie = "os=pc;osver=Microsoft-Windows-10-Professional-build-16299.125-64bit;appver=2.0.3.131777;channel=netease;__remember_me=true";

        protected abstract string? HttpRefer { get; }

        protected abstract Dictionary<string, string>? AdditionalHeaders { get; }

        protected async Task<HttpResponseMessage> GetResponseAsync(string url)
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            AddHeaders(request);

            return await HttpClient.SendAsync(request);
        }

        protected async Task<string> GetAsync(string url)
        {
            using var response = await GetResponseAsync(url);

            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync();
        }

        protected Task<string> PostAsync(string url, Dictionary<string, string> paramDict)
            => SendAsync(url, new FormUrlEncodedContent(paramDict));

        protected Task<string> PostJsonAsync(string url, object param)
            => SendAsync(url, new StringContent(JsonConvert.SerializeObject(param), Encoding.UTF8, "application/json"));

        protected Task<string> PostAsync(string url, Dictionary<string, object> paramDict)
            => SendAsync(url, new StringContent(paramDict.ToJson(), Encoding.UTF8, "application/json"));

        protected Task<string> PostAsync(string url, string param)
            => SendAsync(url, new StringContent(param, Encoding.UTF8, "application/json"));

        private async Task<string> SendAsync(string url, HttpContent content)
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, url) { Content = content };
            AddHeaders(request);

            using var response = await HttpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync();
        }

        // Per-request headers: the HttpClient is shared and used concurrently, so we
        // must NOT mutate its DefaultRequestHeaders (that races across providers).
        private void AddHeaders(HttpRequestMessage request)
        {
            if (!string.IsNullOrEmpty(UserAgent))
                request.Headers.TryAddWithoutValidation("User-Agent", UserAgent);
            if (!string.IsNullOrEmpty(HttpRefer))
                request.Headers.TryAddWithoutValidation("Referer", HttpRefer);
            if (!string.IsNullOrEmpty(Cookie))
                request.Headers.TryAddWithoutValidation("Cookie", Cookie);

            if (AdditionalHeaders is not null)
            {
                foreach (var pair in AdditionalHeaders)
                {
                    request.Headers.TryAddWithoutValidation(pair.Key, pair.Value);
                }
            }
        }
    }

    public static class JsonUtils
    {
        public static T? ToEntity<T>(this string val) => JsonConvert.DeserializeObject<T>(val);

        public static List<T>? ToEntityList<T>(this string val) => JsonConvert.DeserializeObject<List<T>>(val);

        public static string? ToJson<T>(this T entity, Formatting formatting = Formatting.None) => JsonConvert.SerializeObject(entity, formatting);
    }
}
