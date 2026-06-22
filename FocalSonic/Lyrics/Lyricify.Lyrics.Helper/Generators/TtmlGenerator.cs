using Lyricify.Lyrics.Models;
using System.Xml.Linq;

namespace Lyricify.Lyrics.Generators
{
    /// <summary>
    /// Generates Apple Music flavored TTML from <see cref="LyricsData"/>.
    /// The output is intentionally shaped to be consumed by FocalSonic's JS
    /// parseTTML + TTML→eLRC pipeline (syllable spans, x-bg backgrounds,
    /// duet agents, line-keyed translations/transliterations).
    /// </summary>
    public static class TtmlGenerator
    {
        private static readonly XNamespace Ttml = "http://www.w3.org/ns/ttml";
        private static readonly XNamespace Ttm = "http://www.w3.org/ns/ttml#metadata";
        private static readonly XNamespace Itunes = "http://music.apple.com/lyric-ttml-internal";
        private static readonly XNamespace Xml = "http://www.w3.org/XML/1998/namespace";

        public static string? Generate(LyricsData lyricsData)
        {
            if (lyricsData?.Lines is not { Count: > 0 }) return null;

            var body = new XElement(Ttml + "body");
            var div = new XElement(Ttml + "div");
            body.Add(div);

            var translations = new XElement(Ttml + "translation");
            var transliterations = new XElement(Ttml + "transliteration");

            for (int i = 0; i < lyricsData.Lines.Count; i++)
            {
                var line = lyricsData.Lines[i];
                if (line is null) continue;

                var key = "L" + i;
                var p = new XElement(Ttml + "p",
                    new XAttribute("begin", FormatTime(line.StartTimeWithSubLine ?? line.StartTime ?? 0)),
                    new XAttribute("end", FormatTime(line.EndTimeWithSubLine ?? line.EndTime ?? 0)),
                    new XAttribute(Itunes + "key", key),
                    new XAttribute(Ttm + "agent", line.LyricsAlignment == LyricsAlignment.Right ? "v2" : "v1"));

                AppendLineContent(p, line, isBackground: false);

                if (line.SubLine is { } sub)
                {
                    var bg = new XElement(Ttml + "span", new XAttribute(Ttm + "role", "x-bg"));
                    AppendLineContent(bg, sub, isBackground: true);
                    p.Add(bg);
                }

                div.Add(p);

                if (line is IFullLineInfo full)
                {
                    var translation = full.Translations.Values.FirstOrDefault(v => !string.IsNullOrWhiteSpace(v));
                    if (!string.IsNullOrWhiteSpace(translation))
                        translations.Add(new XElement(Ttml + "text", new XAttribute("for", key), translation));

                    if (!string.IsNullOrWhiteSpace(full.Pronunciation))
                        transliterations.Add(new XElement(Ttml + "text", new XAttribute("for", key), full.Pronunciation));
                }
            }

            var head = new XElement(Ttml + "head",
                new XElement(Ttml + "metadata",
                    new XElement(Ttm + "agent", new XAttribute("type", "person"), new XAttribute(Xml + "id", "v1")),
                    new XElement(Ttm + "agent", new XAttribute("type", "other"), new XAttribute(Xml + "id", "v2"))));

            if (translations.HasElements) head.Element(Ttml + "metadata")!.Add(translations);
            if (transliterations.HasElements) head.Element(Ttml + "metadata")!.Add(transliterations);

            var tt = new XElement(Ttml + "tt",
                new XAttribute(XNamespace.Xmlns + "ttm", Ttm.NamespaceName),
                new XAttribute(XNamespace.Xmlns + "itunes", Itunes.NamespaceName),
                new XAttribute(Itunes + "timing", "Word"),
                head,
                body);

            // No indentation: pretty-print whitespace would become bogus zero-time words.
            return tt.ToString(SaveOptions.DisableFormatting);
        }

        private static void AppendLineContent(XElement parent, ILineInfo line, bool isBackground)
        {
            if (line is SyllableLineInfo syllableLine && syllableLine.Syllables is { Count: > 0 })
            {
                foreach (var syllable in syllableLine.Syllables)
                {
                    parent.Add(new XElement(Ttml + "span",
                        new XAttribute("begin", FormatTime(syllable.StartTime)),
                        new XAttribute("end", FormatTime(syllable.EndTime)),
                        syllable.Text));
                }
            }
            else
            {
                parent.Add(new XText(line.Text ?? string.Empty));
            }
        }

        private static string FormatTime(int ms)
        {
            if (ms < 0) ms = 0;
            int minutes = ms / 60000;
            int remainder = ms % 60000;
            int seconds = remainder / 1000;
            int millis = remainder % 1000;
            return $"{minutes:D2}:{seconds:D2}.{millis:D3}";
        }
    }
}
