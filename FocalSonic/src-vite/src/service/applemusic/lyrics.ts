import { httpClient } from "@/api/httpClient";
import { useCacheStore } from "@/store/cache.store";
import { AppleMusicLyricsResponse } from "@/types/applemusic/song";
import { GetLyricsData } from "../subsonic/lyrics";

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
            "l[script]": "en-Latn"
        }
    });

    lyrics = response?.data[0]?.attributes?.ttmlLocalizations || response?.data[0]?.attributes?.ttml;

    useCacheStore.getState().saveLyrics(getLyricsData.id!, lyrics);
    return lyrics;
}

export const lyrics = {
    getLyrics
}