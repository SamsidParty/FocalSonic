using IgniteView.Core;
using Lyricify.Lyrics.Generators;
using Lyricify.Lyrics.Helpers;
using Lyricify.Lyrics.Helpers.Optimization;
using Lyricify.Lyrics.Models;
using Lyricify.Lyrics.Parsers;
using Lyricify.Lyrics.Searchers;
using Newtonsoft.Json;
using System.Text.RegularExpressions;

namespace FocalSonic.Lyrics
{
    /// <summary>
    /// Unified lyric search across the providers bundled in Lyricify Lyrics Helper.
    /// Returns multiple ranked candidates per provider (so the user can pick even
    /// when there's no perfect match) as TTML (syllable) or LRC (line) strings the
    /// JS side runs through its existing TTML→eLRC pipeline. Apple Music is
    /// intentionally NOT handled here; JS owns that flow.
    /// </summary>
    public class LyricSearchService
    {
        // Candidates fetched (and lyric-fetched) per provider. Kept small to bound
        // the number of upstream lyric requests fired per search.
        private const int MaxCandidatesPerProvider = 5;

        private class ProviderLyricResult
        {
            public string Provider { get; set; } = "";
            public string Title { get; set; } = "";
            public string Artist { get; set; } = "";
            public string Album { get; set; } = "";
            public int? DurationMs { get; set; }
            public string Format { get; set; } = "ttml"; // "ttml" | "lrc"
            public string Lyrics { get; set; } = "";
        }

        [Command("searchProviderLyrics")]
        public static async Task<string?> SearchProviderLyrics(string provider, string title, string artist, string album, int durationMs)
        {
            try
            {
                var track = new TrackMetadata
                {
                    Title = title,
                    Artist = artist,
                    Album = string.IsNullOrWhiteSpace(album) ? null : album,
                    DurationMs = durationMs > 0 ? durationMs : null,
                };

                var results = await FetchForProvider(provider.Trim().ToLowerInvariant(), track);
                return JsonConvert.SerializeObject(results);
            }
            catch
            {
                return null;
            }
        }

        private static async Task<List<ProviderLyricResult>> FetchForProvider(string provider, TrackMetadata track)
        {
            return provider switch
            {
                "lrclib" => await FetchCandidates(track, Searchers.LRCLIB, FetchLrclibContent),
                "netease" => await FetchCandidates(track, Searchers.Netease, FetchSyllableContent),
                "qqmusic" => await FetchCandidates(track, Searchers.QQMusic, FetchSyllableContent),
                "musixmatch" => await FetchCandidates(track, Searchers.Musixmatch, FetchSyllableContent),
                "spotify" => await FetchCandidates(track, Searchers.Spotify, FetchSyllableContent),
                _ => new(),
            };
        }

        // Search ranked candidates, fetch lyrics for the top few in parallel, and keep
        // the ones that actually returned lyrics (deduped by content). No minimum match
        // requirement — the user picks from whatever has lyrics.
        private static async Task<List<ProviderLyricResult>> FetchCandidates(
            TrackMetadata track, Searchers searcherType,
            Func<ISearchResult, Task<(string format, string lyrics)?>> fetchContent)
        {
            var output = new List<ProviderLyricResult>();

            List<ISearchResult> matches;
            try
            {
                matches = await searcherType.GetSearcher().SearchForResults(track);
            }
            catch
            {
                return output;
            }

            if (matches is not { Count: > 0 }) return output;

            var built = await Task.WhenAll(matches.Take(MaxCandidatesPerProvider).Select(async match =>
            {
                try
                {
                    var content = await fetchContent(match);
                    if (content is null || string.IsNullOrWhiteSpace(content.Value.lyrics)) return null;
                    return BuildResult(match, content.Value.format, content.Value.lyrics);
                }
                catch
                {
                    return null;
                }
            }));

            var seen = new HashSet<string>();
            foreach (var result in built)
            {
                if (result is null || !seen.Add(result.Lyrics)) continue;
                output.Add(result);
            }

            return output;
        }

        private static async Task<(string format, string lyrics)?> FetchLrclibContent(ISearchResult match)
        {
            if (match is not LRCLIBSearchResult lrc) return null;

            var lyrics = await ProviderHelper.LRCLIBApi.GetById(lrc.Id);
            var content = !string.IsNullOrWhiteSpace(lyrics?.SyncedLyrics) ? lyrics!.SyncedLyrics : lyrics?.PlainLyrics;
            if (string.IsNullOrWhiteSpace(content)) return null;

            return ("lrc", content!.Replace("\r\n", "\n").Trim());
        }

        private static async Task<(string format, string lyrics)?> FetchSyllableContent(ISearchResult match)
        {
            var lyricsData = await FetchLyricsData(match);
            if (lyricsData?.Lines is not { Count: > 0 }) return null;

            var ttml = TtmlGenerator.Generate(lyricsData);
            if (string.IsNullOrWhiteSpace(ttml)) return null;

            return ("ttml", ttml!);
        }

        private static async Task<LyricsData?> FetchLyricsData(ISearchResult match)
        {
            switch (match)
            {
                case NeteaseSearchResult netease:
                {
                    var result = await ProviderHelper.NeteaseApi.GetLyricNew(netease.Id);
                    if (!string.IsNullOrWhiteSpace(result?.Yrc?.Lyric))
                        return ParseHelper.ParseLyrics(result!.Yrc.Lyric, LyricsRawTypes.Yrc);
                    if (!string.IsNullOrWhiteSpace(result?.Lrc?.Lyric))
                        return ParseHelper.ParseLyrics(result!.Lrc.Lyric, LyricsRawTypes.Lrc);
                    return null;
                }

                case QQMusicSearchResult qq:
                {
                    // Prefer the QRC verbatim (syllable) lyrics from the download endpoint;
                    // GetLyric only ever returns plain line-synced LRC. QQ embeds title +
                    // credit lines (作词/作曲/…) up top, so strip those.
                    try
                    {
                        var verbatim = await ProviderHelper.QQMusicApi.GetLyricsAsync(qq.Id);
                        var qrc = ParseQqLyric(verbatim?.Lyrics);
                        if (qrc != null) return StripInfoLines(qrc, match.Title, match.Artist);
                    }
                    catch { }

                    var result = await ProviderHelper.QQMusicApi.GetLyric(qq.Mid);
                    var lrc = ParseQqLyric(result?.Lyric);
                    return lrc != null ? StripInfoLines(lrc, match.Title, match.Artist) : null;
                }

                case MusixmatchSearchResult mxm:
                {
                    var raw = await ProviderHelper.MusixmatchApi.GetFullLyricsRaw(mxm.Id.ToString());
                    if (string.IsNullOrWhiteSpace(raw)) return null;
                    return ParseHelper.ParseLyrics(raw, LyricsRawTypes.Musixmatch);
                }

                case SpotifySearchResult spotify:
                {
                    var raw = await ProviderHelper.SpotifyApi.GetLyrics(spotify.Id);
                    if (string.IsNullOrWhiteSpace(raw)) return null;
                    return ParseHelper.ParseLyrics(raw, LyricsRawTypes.Spotify);
                }

                default:
                    return null;
            }
        }

        // Remove leading title/credit lines and inline credit lines (作词/作曲/编曲/…).
        // Uses the track metadata so the "Title - Artist" heading line is caught too.
        private static LyricsData? StripInfoLines(LyricsData data, string? title, string? artist)
        {
            if (data.Lines is not { Count: > 0 }) return data;

            data.TrackMetadata ??= new TrackMetadata();
            if (string.IsNullOrWhiteSpace(data.TrackMetadata.Title)) data.TrackMetadata.Title = title;
            if (string.IsNullOrWhiteSpace(data.TrackMetadata.Artist)) data.TrackMetadata.Artist = artist;

            var flags = InfoLines.CheckInfoLines(data);
            if (flags is { Count: > 0 } && flags.Count == data.Lines.Count)
                data.Lines = data.Lines.Where((_, i) => !flags[i]).ToList();

            return data.Lines is { Count: > 0 } ? data : null;
        }

        // QRC carries per-syllable "(start,duration)" markers; without them it's plain LRC.
        // (TypeHelper.GetLyricsTypes is a stub in this library, so detect it here.)
        private static LyricsData? ParseQqLyric(string? raw)
        {
            if (string.IsNullOrWhiteSpace(raw)) return null;

            var type = Regex.IsMatch(raw, @"\(\d+,\d+\)") ? LyricsRawTypes.Qrc : LyricsRawTypes.Lrc;
            var data = ParseHelper.ParseLyrics(raw, type);

            return data?.Lines is { Count: > 0 } ? data : null;
        }

        private static ProviderLyricResult BuildResult(ISearchResult match, string format, string lyrics) => new()
        {
            Provider = match.Searcher.DisplayName,
            Title = match.Title ?? "",
            Artist = match.Artist ?? "",
            Album = match.Album ?? "",
            DurationMs = match.DurationMs,
            Format = format,
            Lyrics = lyrics,
        };
    }
}
