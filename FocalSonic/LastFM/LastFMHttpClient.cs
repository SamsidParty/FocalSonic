using FocalSonic.AppleMusic;
using IgniteView.Core;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace FocalSonic.LastFM
{
    public class LastFMHttpClient : HttpClient
    {
        public static LastFMHttpClient Instance = new LastFMHttpClient();

        public LastFMHttpClient()
        {
            this.BaseAddress = new Uri("https://ws.audioscrobbler.com/2.0/");
        }

        // Creates an API signature per https://www.last.fm/api/authspec
        public static string CreateApiSignature(IDictionary<string, string> parameters)
        {
            // Exclude format param if present when signing
            var items = parameters
                .Where(kv => !string.Equals(kv.Key, "format", StringComparison.OrdinalIgnoreCase))
                .OrderBy(kv => kv.Key, StringComparer.Ordinal)
                .Select(kv => kv.Key + kv.Value);

            var concatenated = string.Concat(items) + (LastFMConstants.APISecret ?? string.Empty);

            using (var md5 = MD5.Create())
            {
                var bytes = Encoding.UTF8.GetBytes(concatenated);
                var hash = md5.ComputeHash(bytes);
                var sb = new StringBuilder();
                foreach (var b in hash) sb.Append(b.ToString("x2"));
                return sb.ToString();
            }
        }

        // Calls an authenticated endpoint
        public async Task<JsonElement> CallAPIAsync(string method, Dictionary<string, string> parameters)
        {
            parameters["method"] = method;
            parameters["format"] = "json"; // Aint nobody wanna parse XML its not 2008 anymore

            // Insert secret keys
            parameters["sk"] = LocalStorage.GetItem("lastfm_session_key", "default").Result;
            parameters["api_key"] = LastFMConstants.APIKey;

            // Sign the request
            var postData = new Dictionary<string, string>(parameters)
            {
                ["api_sig"] = CreateApiSignature(parameters)
            };

            using (var content = new FormUrlEncodedContent(postData))
            {
                var resp = await this.PostAsync(string.Empty, content);
                resp.EnsureSuccessStatusCode();
                var body = await resp.Content.ReadAsStringAsync();

                // Parse JSON response
                using (var doc = JsonDocument.Parse(body))
                {
                    return doc.RootElement;
                }
            }
        }

        // Calls auth.getSession with the provided token and returns (sessionKey, username)
        public async Task<(string sessionKey, string username)> GetSessionAsync(string token)
        {
            if (string.IsNullOrEmpty(token)) throw new ArgumentNullException(nameof(token));

            var parameters = new Dictionary<string, string>
            {
                ["method"] = "auth.getSession",
                ["api_key"] = LastFMConstants.APIKey,
                ["token"] = token,
                ["format"] = "json"
            };

            // Sign the request
            var postData = new Dictionary<string, string>(parameters)
            {
                ["api_sig"] = CreateApiSignature(parameters)
            };

            using (var content = new FormUrlEncodedContent(postData))
            {
                var resp = await this.PostAsync(string.Empty, content);
                resp.EnsureSuccessStatusCode();
                var body = await resp.Content.ReadAsStringAsync();

                // Parse JSON response: { "session": { "name": "...", "key": "..." } }
                using (var doc = JsonDocument.Parse(body))
                {
                    if (doc.RootElement.TryGetProperty("session", out var sessionElem))
                    {
                        var name = sessionElem.GetProperty("name").GetString();
                        var key = sessionElem.GetProperty("key").GetString();
                        return (key, name);
                    }
                    else if (doc.RootElement.TryGetProperty("error", out var errorElem))
                    {
                        var code = doc.RootElement.GetProperty("error").GetInt32();
                        var message = doc.RootElement.GetProperty("message").GetString();
                        throw new Exception($"Last.fm API error {code}: {message}");
                    }
                    else
                    {
                        throw new Exception("Unexpected Last.fm response: " + body);
                    }
                }
            }
        }
    }
}
