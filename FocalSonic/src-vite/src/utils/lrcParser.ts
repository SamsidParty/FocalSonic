/**
 * LRC Parser - Custom parser for LRC and Enhanced LRC (ELRC) formats
 * Replaces the react-lrc library for better performance
 */

import { TRANSLATION_MARKER, TRANSLITERATION_MARKER } from "./lyricEligibility";

// Regex patterns for parsing
const LRC_LINE_REGEX = /^\[(\d{2}):(\d{2})\.(\d{2,3})\]\s*(.*)$/;
const ELRC_TAG_REGEX = /<(\d{2}):(\d{2})\.(\d{2,3})>([^<]*)/g;
const ELRC_TEST_REGEX = /^(?:<\d{2}:\d{2}\.\d{2,3}>[^<]*)+$/;

export interface ParsedLyricWord {
    time: number; // Start time in seconds
    duration: number; // Duration in seconds
    text: string;
}

export interface ParsedLyricLine {
    id: string;
    lineNumber: number;
    startTime: number; // Start time in milliseconds
    content: string; // Raw original content (for display fallback)
    words: ParsedLyricWord[]; // ELRC word-level data (original)
    transliterationContent: string | null; // Transliteration (pronunciation) channel
    transliterationWords: ParsedLyricWord[];
    translationContent: string | null; // Translation channel
    translationWords: ParsedLyricWord[];
}

export interface ParsedLyrics {
    lines: ParsedLyricLine[];
}

/**
 * Parse time components into milliseconds
 */
function parseTimeToMs(minutes: string, seconds: string, fraction: string): number {
    const min = parseInt(minutes, 10);
    const sec = parseInt(seconds, 10);
    // Handle both 2-digit (centiseconds) and 3-digit (milliseconds) fractions
    const frac = fraction.length === 2
        ? parseInt(fraction, 10) * 10
        : parseInt(fraction, 10);
    return (min * 60 + sec) * 1000 + frac;
}

/**
 * Parse ELRC word-level timestamps from content
 * Returns array of words with their timing
 */
function parseElrcWords(content: string, lineStartTimeMs: number): ParsedLyricWord[] {
    const words: ParsedLyricWord[] = [];

    // Check if content contains ELRC tags
    const isElrc = ELRC_TEST_REGEX.test(content.trim());

    if (!isElrc) {
        // Not ELRC - treat entire content as single word at line start
        if (content.trim()) {
            words.push({
                time: lineStartTimeMs / 1000,
                duration: 0.3, // Default duration
                text: content,
            });
        }
        return words;
    }

    // Parse ELRC tags
    const regex = new RegExp(ELRC_TAG_REGEX.source, ELRC_TAG_REGEX.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(content)) !== null) {
        const timeSeconds = parseTimeToMs(match[1], match[2], match[3]) / 1000;
        const text = match[4];

        // Skip empty text or merge with previous if time is very close to 0
        const lastWord = words[words.length - 1];
        if (timeSeconds < 0.05 && lastWord) {
            lastWord.text += text;
        } else if (text || !lastWord) {
            words.push({
                time: Math.max(timeSeconds, 0),
                duration: 0.3, // Will be calculated below
                text,
            });
        }
    }

    // Handle single word at time 0 - use line start time instead
    if (words.length === 1 && words[0].time === 0) {
        words[0].time = lineStartTimeMs / 1000;
    }

    // Calculate durations based on next word's start time
    for (let i = 0; i < words.length; i++) {
        if (i < words.length - 1) {
            words[i].duration = words[i + 1].time - words[i].time;
        } else {
            words[i].duration = 0.3; // Default for last word
        }
    }

    return words;
}

/**
 * Parse a single LRC line
 */
function parseLrcLine(line: string, lineNumber: number): ParsedLyricLine | null {
    const match = line.match(LRC_LINE_REGEX);

    if (!match) {
        return null;
    }

    const startTimeMs = parseTimeToMs(match[1], match[2], match[3]);
    const rawContent = match[4];
    let transliterationContent: string | null = null;
    let translationContent: string | null = null;

    // Alternate channels are appended inline after the original, each behind its
    // own marker (`original⏩transliteration⏭translation`). Tokenize on the markers
    // so parsing is independent of the order the channels were appended in.
    const segments = rawContent.split(/([⏩⏭])/);
    let content = segments[0];
    for (let k = 1; k < segments.length; k += 2) {
        const marker = segments[k];
        const text = segments[k + 1] ?? "";
        if (marker === TRANSLITERATION_MARKER) {
            transliterationContent = text || null;
        } else if (marker === TRANSLATION_MARKER) {
            translationContent = text || null;
        }
    }

    // Parse word-level timing
    const words = parseElrcWords(content, startTimeMs);
    const transliterationWords = transliterationContent ? parseElrcWords(transliterationContent, startTimeMs) : [];
    const translationWords = translationContent ? parseElrcWords(translationContent, startTimeMs) : [];

    return {
        id: `line-${lineNumber}-${startTimeMs}`,
        lineNumber,
        startTime: startTimeMs,
        content,
        words,
        transliterationContent,
        transliterationWords,
        translationContent,
        translationWords,
    };
}

/**
 * Parse complete LRC/ELRC lyrics string
 */
export function parseLrc(lrcString: string): ParsedLyrics {
    const lines = lrcString.split("\n");
    const parsedLines: ParsedLyricLine[] = [];
    let lineNumber = 0;

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        const parsed = parseLrcLine(trimmedLine, lineNumber);
        if (parsed) {
            parsedLines.push(parsed);
            lineNumber++;
        }
    }

    return { lines: parsedLines };
}

/**
 * Find the current active line index based on timestamp
 */
export function findActiveLine(lyrics: ParsedLyrics, timestampMs: number): number {
    let activeIndex = -1;

    for (let i = 0; i < lyrics.lines.length; i++) {
        const line = lyrics.lines[i];
        if (line.startTime <= timestampMs) {
            activeIndex = i;
        } else {
            break;
        }
    }

    return activeIndex;
}
