using Newtonsoft.Json.Linq;
using System.Text;
using System.Text.RegularExpressions;

namespace FocalSonic.AppleMusic
{
    /// <summary>
    /// Finds the developer token Apple's web player (music.apple.com) is built with, the same
    /// token the Windows and Linux sign-in picks up from MusicKit JS. This reads it straight
    /// out of the site's JavaScript over HTTP, for platforms where loading the site in a web
    /// view doesn't expose it (WebKit on macOS).
    /// </summary>
    public static class AppleMusicDeveloperToken
    {
        const string WebPlayerIssuer = "AMPWebPlay";
        const string SiteURL = "https://music.apple.com";

        /// <summary>Stored tokens are replaced this long before they expire.</summary>
        static readonly TimeSpan RefreshMargin = TimeSpan.FromDays(7);

        static readonly HttpClient Client = CreateClient();

        static HttpClient CreateClient()
        {
            var client = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
            // The site serves its app bundle to browsers.
            client.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15");
            return client;
        }

        public static async Task<string> FetchAsync()
        {
            var html = await Client.GetStringAsync($"{SiteURL}/us/browse");

            // The main bundle is /assets/index~<hash>.js (older builds used index-<hash>.js).
            var scripts = Regex.Matches(html, @"/assets/index[^""'<>\s]*?\.js")
                .Select((match) => match.Value)
                .Distinct();

            foreach (var script in scripts)
            {
                var token = FindWebPlayerToken(await Client.GetStringAsync(SiteURL + script));
                if (token != null) return token;
            }

            throw new Exception("Couldn't find the Apple Music web player's developer token");
        }

        /// <summary>Returns <paramref name="current"/> while it's still good, otherwise a fresh token.</summary>
        public static async Task<string> EnsureFreshAsync(string? current)
        {
            if (GetExpiry(current) is { } expiry && expiry - DateTimeOffset.UtcNow > RefreshMargin)
            {
                return current!;
            }

            try
            {
                return await FetchAsync();
            }
            catch when (GetExpiry(current) > DateTimeOffset.UtcNow)
            {
                // Offline or the site changed: an old token that still works beats none.
                return current!;
            }
        }

        public static DateTimeOffset? GetExpiry(string? token)
        {
            var expiry = ReadClaims(token)?.Value<long?>("exp");
            return expiry == null ? null : DateTimeOffset.FromUnixTimeSeconds(expiry.Value);
        }

        // The bundle carries several JWTs for different Apple services; only the web player's
        // is accepted with a music user token.
        static string? FindWebPlayerToken(string javascript)
        {
            foreach (Match match in Regex.Matches(javascript, @"eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+"))
            {
                if (ReadClaims(match.Value)?.Value<string>("iss") == WebPlayerIssuer) return match.Value;
            }
            return null;
        }

        static JObject? ReadClaims(string? token)
        {
            var parts = token?.Split('.');
            if (parts == null || parts.Length != 3) return null;

            try
            {
                var payload = parts[1].Replace('-', '+').Replace('_', '/');
                payload = payload.PadRight(payload.Length + (4 - payload.Length % 4) % 4, '=');
                return JObject.Parse(Encoding.UTF8.GetString(Convert.FromBase64String(payload)));
            }
            catch
            {
                return null;
            }
        }
    }
}
