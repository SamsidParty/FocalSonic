/**
 * Centralized eligibility + channel-marker helpers for alternate lyrics.
 *
 * Alternate lyric channels are encoded inline in the LRC string using marker
 * characters. `⏩` (transliteration) is intentionally chosen because it survives
 * the Google Translate API round-trip without being mangled; `⏭` (translation)
 * is a sibling glyph picked for the same robustness.
 */

import { stripLRCLine } from "./lyricUtils";

// Marks the start of the transliteration channel within an LRC line.
export const TRANSLITERATION_MARKER = "⏩";
// Marks the start of the translation channel within an LRC line.
export const TRANSLATION_MARKER = "⏭";

// Matches either channel marker (used to split an LRC line into its channels).
export const CHANNEL_MARKER_REGEX = /[⏩⏭]/;

// Detects any non-Latin script. This is the single source of truth for
// "does this text need transliteration/translation" decisions.
export const NON_LATIN_REGEX =
    /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Devanagari}\p{Script=Bengali}\p{Script=Gurmukhi}\p{Script=Gujarati}\p{Script=Oriya}\p{Script=Tamil}\p{Script=Telugu}\p{Script=Kannada}\p{Script=Malayalam}\p{Script=Sinhala}\p{Script=Thai}\p{Script=Khmer}\p{Script=Lao}\p{Script=Myanmar}\p{Script=Ethiopic}\p{Script=Georgian}\p{Script=Armenian}\p{Script=Cherokee}\p{Script=Yi}]/u;

/**
 * Whether a piece of text contains any non-Latin script characters.
 */
export function hasNonLatin(text?: string): boolean {
    return !!text && NON_LATIN_REGEX.test(text);
}

/**
 * Whether the given lyrics are eligible for transliteration (romanization).
 * A song only benefits from transliteration when it contains non-Latin script.
 */
export function canTransliterate(lyrics?: string): boolean {
    return lyricsHaveNonLatin(lyrics);
}

/**
 * Whether the given lyrics are eligible for translation.
 *
 * For now this uses the same non-Latin heuristic as transliteration. It is kept
 * as a separate function on purpose so translation can later adopt a smarter
 * check (e.g. detecting Latin-script foreign languages like Spanish) without
 * touching call sites.
 */
export function canTranslate(lyrics?: string): boolean {
    return lyricsHaveNonLatin(lyrics);
}

/**
 * Test a whole (possibly LRC/TTML) lyrics blob for non-Latin content, ignoring
 * any already-attached alternate channels so their romaji/translation don't
 * count as "original" content.
 */
function lyricsHaveNonLatin(lyrics?: string): boolean {
    if (!lyrics) return false;

    // TTML still contains the original CJK/etc. text, so a raw test is fine.
    if (!lyrics.includes(TRANSLITERATION_MARKER) && !lyrics.includes(TRANSLATION_MARKER)) {
        return NON_LATIN_REGEX.test(lyrics);
    }

    // For LRC, only look at the original (main) part of each line.
    return lyrics
        .split("\n")
        .some((line) => hasNonLatin(stripLRCLine(line)));
}
