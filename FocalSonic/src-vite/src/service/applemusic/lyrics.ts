import { httpClient } from "@/api/httpClient";
import { useCacheStore } from "@/store/cache.store";
import { AppleMusicLyricsResponse } from "@/types/applemusic/song";
import { GetLyricsData } from "../subsonic/lyrics";

async function getLyrics(getLyricsData: GetLyricsData) {

    let lyrics = useCacheStore.getState().tryGetLyrics(getLyricsData.id!);
    if (lyrics) {
        return lyrics;
    }

    const response = await httpClient<AppleMusicLyricsResponse>(`/applemusic/catalog/{storefront}/songs/${getLyricsData.id}/syllable-lyrics?l=en-US`, {
        method: "GET"
    });

    (response && response?.data[0]?.attributes?.ttml) && (lyrics = response!.data[0].attributes.ttml);

    useCacheStore.getState().saveLyrics(getLyricsData.id!, lyrics);
    return lyrics;
}

export const lyrics = {
    getLyrics
}