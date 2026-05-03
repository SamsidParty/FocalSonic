import { httpClient } from "@/api/httpClient";
import { AppleMusicLyricsResponse } from "@/types/applemusic/song";
import { GetLyricsData, getLyricsFromLRCLib, getLyricsFromMusixmatch, getLyricsFromNetEase, LyricsResult } from "../subsonic/lyrics";

async function getLyrics(getLyricsData: GetLyricsData): Promise<LyricsResult> {
    const startTime = Date.now();
    let source = "";

    if (window?.igniteView?.commandBridge?.getCustomOverride) {
        const cachedLyrics = await window.igniteView.commandBridge.getCustomOverride("AppleLyrics2", getLyricsData.id!);
        if (cachedLyrics) {
            const value = cachedLyrics !== "none" ? cachedLyrics : undefined;
            return { value, source: "Cache", durationMs: 0 };
        }
    }

    const response = await httpClient<AppleMusicLyricsResponse>(`/applemusic/catalog/{storefront}/songs/${getLyricsData.id}/syllable-lyrics`, {
        method: "GET",
        query: {
            // I spent 4 hours reverse engineering the Apple Music android app to find these parameters
            l: "en-US",
            extend: "ttmlLocalizations",
            "l[script]": "en-Latn",
            "l[lyrics]": "en-us"
        }
    });

    let lyrics = response?.data[0]?.attributes?.ttmlLocalizations || response?.data[0]?.attributes?.ttml;

    // Keep unsynced Apple lyrics as a last resort - prefer synced from other providers
    const unsyncedAppleLyrics = lyrics?.includes("itunes:timing=\"None\"") ? lyrics : null;
    if (unsyncedAppleLyrics) {
        lyrics = null;
    } else if (lyrics) {
        source = "Apple Music";
    }

    if (!lyrics) {
        const result = await getLyricsFromLRCLib(getLyricsData);
        if (result.value) { lyrics = result.value; source = "LRCLib"; }
    }

    if (!lyrics) {
        const result = await getLyricsFromMusixmatch(getLyricsData);
        if (result.value) { lyrics = result.value; source = "Musixmatch"; }
    }

    if (!lyrics) {
        const result = await getLyricsFromNetEase(getLyricsData);
        if (result.value) { lyrics = result.value; source = "NetEase"; }
    }

    // Absolute last resort: unsynced Apple Music lyrics (no karaoke scroll, but at least readable)
    if (!lyrics && unsyncedAppleLyrics) {
        lyrics = unsyncedAppleLyrics;
        source = "Apple Music";
    }

    /*if (window?.igniteView?.commandBridge?.saveCustomOverride && lyrics) {
        await window.igniteView.commandBridge.saveCustomOverride("AppleLyrics2", getLyricsData.id!, lyrics);
    }*/

    return { value: lyrics ?? undefined, source, durationMs: Date.now() - startTime };
}

export const lyrics = {
    getLyrics
};
