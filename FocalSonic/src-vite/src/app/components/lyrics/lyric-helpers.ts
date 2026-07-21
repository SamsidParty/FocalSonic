import { LyricLine, parseTTML } from "@/lib/ttml";
import { hasNonLatin, TRANSLATION_MARKER, TRANSLITERATION_MARKER } from "@/utils/lyricEligibility";

export function areLyricsSynced(lyrics?: string) {
    // Most LRC files start with the string "[00:" or "[01:" indicating synced lyrics
    const lyric = lyrics?.trim() ?? "";
    return (
        lyric.startsWith("[00:") ||
        lyric.startsWith("[01:") ||
        lyric.startsWith("[02:") ||
        areLyricsTTML(lyrics)
    );
}

export function areLyricsTTML(lyrics?: string) {
    const lyric = lyrics?.trim() ?? "";
    return lyric.startsWith("<tt");
}

/**
 * Convert a TTML lyric document into our ELRC string format, embedding every
 * natively-available alternate channel. Which channels get *shown* is decided
 * at render time by the user's selection - here we simply emit whatever the
 * source provides so downstream caching doesn't depend on the selection.
 *
 * Line format: `[time] <elrc original>[⏩<elrc transliteration>][⏭<elrc translation>]`
 */
export function convertTTMLToLRC(ttml: string): string {
    try {
        const parsedTTML = parseTTML(ttml);

        const convertMS = (ms: number, wrap?: boolean) => {
            const minutes = Math.floor(ms / 60000);
            const remainingMsAfterMinutes = ms % 60000;
            const seconds = Math.floor(remainingMsAfterMinutes / 1000);
            const milliseconds = remainingMsAfterMinutes % 1000;
            const formattedMinutes = String(minutes).padStart(2, "0");
            const formattedSeconds = String(seconds).padStart(2, "0");
            const formattedMilliseconds = String(milliseconds).padStart(3, "0");

            if (wrap) {
                return `<${formattedMinutes}:${formattedSeconds}.${formattedMilliseconds.substring(0, 2)}>`;
            }

            return `${formattedMinutes}:${formattedSeconds}.${formattedMilliseconds}`;
        };

        // Build the ELRC for one alternate channel, or "" if it should be skipped.
        // Note: identical-text dedup is intentionally NOT done here. That happens
        // at render time where all channels' word-timing is known, so the best-timed
        // copy can be kept rather than blindly dropping the alternate.
        const buildChannel = (
            line: LyricLine,
            altKey: "altWord_transliteration" | "altWord_translation",
            marker: string,
            skipRedundant: (originalText: string) => boolean,
        ): string => {
            if (line.words.filter((w) => w.word && w[altKey]).length === 0) {
                return "";
            }

            const originalText = line.words.map((w) => w.word?.replaceAll(" ", "").trim()).join("");

            // Skip only on a channel-specific redundancy rule (e.g. an all-Latin
            // line doesn't need transliteration - "and" -> "ando").
            if (skipRedundant(originalText)) {
                return "";
            }

            return `${marker}${line.words.map((w) => convertMS(w.startTime, true) + (w[altKey] ?? "")).join(" ")}`;
        };

        const convertedELRC = parsedTTML.lyricLines.map((line) => {
            let output = `[${convertMS(line.startTime)}] ${line.words.map((word) => convertMS(word.startTime, true) + (word.word)).join("")}`;

            // Transliteration: also skip lines whose original is fully Latin -
            // romanizing English produces nonsense ("and" -> "ando").
            output += buildChannel(line, "altWord_transliteration", TRANSLITERATION_MARKER, (originalText) => !hasNonLatin(originalText));
            output += buildChannel(line, "altWord_translation", TRANSLATION_MARKER, () => false);

            return output;
        }).join("\n");

        return convertedELRC;
    }
    catch (error) {
        console.error("Error parsing TTML:", error);
    }

    return ttml;
}