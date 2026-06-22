import { httpClient } from "@/api/httpClient";
import { AppleMusicLyricsResponse } from "@/types/applemusic/song";

export type LyricProviderId = "applemusic" | "lrclib" | "musixmatch" | "netease" | "qqmusic" | "spotify";

export interface LyricSearchQuery {
    title: string
    artist: string
    album?: string
    duration?: number // seconds
    appleMusicId?: string
}

export interface ProviderLyricResult {
    providerId: LyricProviderId
    provider: string // display name
    title: string
    artist: string
    album: string
    durationMs?: number
    format: "ttml" | "lrc"
    lyrics: string // TTML or (e)LRC, ready for LyricsTab
}

export const LYRIC_PROVIDERS: { id: LyricProviderId; name: string }[] = [
    { id: "applemusic", name: "Apple Music" },
    { id: "lrclib", name: "LRCLIB" },
    { id: "musixmatch", name: "Musixmatch" },
    { id: "netease", name: "NetEase" },
    { id: "qqmusic", name: "QQ Music" },
    { id: "spotify", name: "Spotify" },
];

// Apple Music lyrics stay in JS — the storefront proxy and token live here.
export async function getAppleMusicSyllableLyrics(catalogId?: string): Promise<string | null> {
    if (!catalogId) return null;

    try {
        const response = await httpClient<AppleMusicLyricsResponse>(`/applemusic/catalog/{storefront}/songs/${catalogId}/syllable-lyrics`, {
            method: "GET",
            query: {
                l: "en-US",
                extend: "ttmlLocalizations",
                "l[script]": "en-Latn",
                "l[lyrics]": "en-us",
            },
        });

        let lyrics = response?.data[0]?.attributes?.ttmlLocalizations || response?.data[0]?.attributes?.ttml;

        // Unsynced apple lyrics aren't worth it; other providers do better.
        if (lyrics?.includes("itunes:timing=\"None\"")) lyrics = null;

        return lyrics || null;
    } catch {
        return null;
    }
}

// Unified entry point: search a single provider, get back any candidates it found
// (each with its own lyrics). Empty array means nothing usable was found.
export async function fetchProviderLyrics(providerId: LyricProviderId, query: LyricSearchQuery): Promise<ProviderLyricResult[]> {
    const displayName = LYRIC_PROVIDERS.find((p) => p.id === providerId)?.name ?? providerId;
    const durationMs = query.duration ? Math.round(query.duration * 1000) : 0;

    if (providerId === "applemusic") {
        const lyrics = await getAppleMusicSyllableLyrics(query.appleMusicId);
        if (!lyrics) return [];
        return [{
            providerId,
            provider: displayName,
            title: query.title,
            artist: query.artist,
            album: query.album || "",
            durationMs: durationMs || undefined,
            format: "ttml",
            lyrics,
        }];
    }

    if (!window?.igniteView?.commandBridge?.searchProviderLyrics) return [];

    try {
        const raw = await window.igniteView.commandBridge.searchProviderLyrics(
            providerId,
            query.title,
            query.artist,
            query.album || "",
            durationMs,
        );

        if (!raw) return [];

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];

        return parsed
            .filter((entry) => entry?.Lyrics)
            .map((entry): ProviderLyricResult => ({
                providerId,
                provider: entry.Provider || displayName,
                title: entry.Title || query.title,
                artist: entry.Artist || query.artist,
                album: entry.Album || "",
                durationMs: entry.DurationMs ?? undefined,
                format: entry.Format === "lrc" ? "lrc" : "ttml",
                lyrics: entry.Lyrics,
            }));
    } catch {
        return [];
    }
}
