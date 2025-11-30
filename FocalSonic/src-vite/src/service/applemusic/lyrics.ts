import { AppleMusicLyricsResponse } from "@/types/applemusic/song";
import { GetLyricsData, getLyricsFromLyricOtter } from "../subsonic/lyrics";

async function getLyrics(getLyricsData: GetLyricsData) {
    
    /*
    if (window?.igniteView?.commandBridge?.getCustomOverride) {
        const cachedLyrics = await window.igniteView.commandBridge.getCustomOverride("AppleLyrics", getLyricsData.id!);
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
    });*/

    const response = {} as unknown as AppleMusicLyricsResponse;
    let lyrics = response?.data[0]?.attributes?.ttmlLocalizations || response?.data[0]?.attributes?.ttml;
    
    // No point using unsynced lyrics from apple when we can find synced ones from other providers
    if (lyrics?.includes("itunes:timing=\"None\"")) {
        lyrics = null;
    }

    // Fetch from alternative providers if no lyrics found
    if (!lyrics) {
        lyrics = (await getLyricsFromLyricOtter(getLyricsData)).value;
    }

    if (window?.igniteView?.commandBridge?.saveCustomOverride && lyrics) {
        await window.igniteView.commandBridge.saveCustomOverride("AppleLyrics", getLyricsData.id!, lyrics);
    }

    return lyrics;
}

export const lyrics = {
    getLyrics
};