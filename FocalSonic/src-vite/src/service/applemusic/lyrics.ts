import { httpClient } from "@/api/httpClient";
import { AppleMusicLyricsResponse } from "@/types/applemusic/song";
import { GetLyricsData, getLyricsFromGenius, getLyricsFromLRCLib, getLyricsFromMusixmatch, getLyricsFromNetEase } from "../subsonic/lyrics";

async function getLyrics(getLyricsData: GetLyricsData) {
    

    
    if (window?.igniteView?.commandBridge?.getCustomOverride) {
        const cachedLyrics = await window.igniteView.commandBridge.getCustomOverride("AppleLyrics2", getLyricsData.id!);
        if (cachedLyrics) {
            return cachedLyrics !== "none" ? cachedLyrics : null;
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

    // Keep unsynced Apple lyrics as a last resort — prefer synced from other providers
    const unsyncedAppleLyrics = lyrics?.includes("itunes:timing=\"None\"") ? lyrics : null;
    if (unsyncedAppleLyrics) {
        lyrics = null;
    }

    if (!lyrics) {
        lyrics = (await getLyricsFromLRCLib(getLyricsData)).value;
    }

    if (!lyrics) {
        lyrics = (await getLyricsFromMusixmatch(getLyricsData)).value;
    }

    if (!lyrics) {
        lyrics = (await getLyricsFromNetEase(getLyricsData)).value;
    }

    if (!lyrics) {
        lyrics = (await getLyricsFromGenius(getLyricsData)).value;
    }

    // Absolute last resort: unsynced Apple Music lyrics (no karaoke scroll, but at least readable)
    if (!lyrics && unsyncedAppleLyrics) {
        lyrics = unsyncedAppleLyrics;
    }

    /*if (window?.igniteView?.commandBridge?.saveCustomOverride && lyrics) {
        await window.igniteView.commandBridge.saveCustomOverride("AppleLyrics2", getLyricsData.id!, lyrics);
    }*/

    return lyrics;
}

export const lyrics = {
    getLyrics
};