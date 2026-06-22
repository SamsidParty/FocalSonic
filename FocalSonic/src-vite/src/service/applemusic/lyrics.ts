import { fetchProviderLyrics } from "@/service/lyrics/providers";
import { GetLyricsData, getLyricsFromLRCLib } from "../subsonic/lyrics";

async function getLyrics(getLyricsData: GetLyricsData) {

    if (window?.igniteView?.commandBridge?.getCustomOverride && getLyricsData.id) {
        const cachedLyrics = await window.igniteView.commandBridge.getCustomOverride("AppleLyrics2", getLyricsData.id!);
        if (cachedLyrics) {
            return cachedLyrics !== "none" ? cachedLyrics : null;
        }
    }

    const [apple] = await fetchProviderLyrics("applemusic", {
        title: getLyricsData.title,
        artist: getLyricsData.artist,
        album: getLyricsData.album,
        duration: getLyricsData.duration,
        appleMusicId: getLyricsData.id,
    });

    let lyrics = apple?.lyrics || null;

    if (!lyrics) {
        lyrics = (await getLyricsFromLRCLib(getLyricsData)).value;
    }

    return lyrics;
}

export const lyrics = {
    getLyrics
};