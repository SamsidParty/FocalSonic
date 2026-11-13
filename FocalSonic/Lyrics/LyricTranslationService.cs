using IgniteView.Core;

namespace FocalSonic.Lyrics
{
    /// <summary>
    /// Fetches lyric translations / transliterations from Google Translate on the
    /// C# side, since the webview's requests to translate.googleapis.com are
    /// blocked by CORS. Returns the raw JSON response; JS owns the parsing.
    /// </summary>
    public class LyricTranslationService
    {
        [Command("translateLyrics")]
        public static async Task<string?> TranslateLyrics(string text, string targetLanguage, bool romaji)
        {
            try
            {
                var lang = Uri.EscapeDataString(targetLanguage);
                var url = "https://translate.googleapis.com/translate_a/single?client=gtx"
                    + $"&sl={(romaji ? lang : "auto")}&tl={lang}"
                    + (romaji ? "-Latn&dt=rm" : "")
                    + $"&dt=t&q={Uri.EscapeDataString(text)}";

                var response = await Program.Http.GetAsync(url);
                if (!response.IsSuccessStatusCode) return null;
                return await response.Content.ReadAsStringAsync();
            }
            catch
            {
                return null;
            }
        }
    }
}
