import { httpClient } from "@/api/httpClient";
import { useCacheStore } from "@/store/cache.store";
import { AppleMusicLyricsResponse } from "@/types/applemusic/song";
import { GetLyricsData, getLyricsFromLRCLib } from "../subsonic/lyrics";

async function getLyrics(getLyricsData: GetLyricsData) {

    let lyrics = useCacheStore.getState().tryGetLyrics(getLyricsData.id!);
    if (lyrics) {
        return lyrics;
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

    lyrics = response?.data[0]?.attributes?.ttmlLocalizations || response?.data[0]?.attributes?.ttml;
    
    // No point using unsynced lyrics from apple when we can find synced ones from other providers
    if (lyrics?.includes("itunes:timing=\"None\"")) {
        lyrics = null;
    }

    // Fetch from LRCLib
    if (!lyrics) {
        lyrics = (await getLyricsFromLRCLib(getLyricsData)).value;
    }

    useCacheStore.getState().saveLyrics(getLyricsData.id!, lyrics);
    return lyrics;
}

export const lyrics = {
    getLyrics
};