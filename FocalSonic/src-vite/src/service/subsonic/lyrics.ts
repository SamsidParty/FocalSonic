import { httpClient } from "@/api/httpClient";
import { useAppStore } from "@/store/app.store";
import { useCacheStore } from "@/store/cache.store";
import { ILyricsList, LyricsResponse, OpenLyricsResponse } from "@/types/responses/song";
import { lrclibClient } from "@/utils/appName";
import { checkServerType } from "@/utils/servers";

export interface GetLyricsData {
    artist: string
    title: string
    album?: string
    duration?: number
    id?: string
    isrc?: string
}

interface LRCLibResponse {
    id: number
    trackName: string
    artistName: string
    plainLyrics: string
    syncedLyrics: string
}

async function getLyrics(getLyricsData: GetLyricsData) {
    
    let lyrics = useCacheStore.getState().tryGetLyrics(getLyricsData.id!);
    if (lyrics) {
        return lyrics;
    }

    const response = await httpClient<LyricsResponse>("/getLyrics", {
        method: "GET",
        query: {
            artist: getLyricsData.artist,
            title: getLyricsData.title,
        },
    });

    const basicLyrics = response?.data?.lyrics?.value;
    if (basicLyrics) {
        lyrics = basicLyrics;
    }

    if (lyrics && response?.data.openSubsonic) {
        // Try to get synced lyrics using getLyricsBySongId
        const openResponse = await httpClient<OpenLyricsResponse>("/getLyricsBySongId", {
            method: "GET",
            query: {
                id: getLyricsData.id,
            },
        });

        if ((openResponse?.data?.lyricsList?.structuredLyrics?.length || 0) > 0) {
            lyrics = convertToLRC(openResponse?.data?.lyricsList)?.value;
        }
    
    }

    if (!lyrics) {
        lyrics = (await getLyricsFromLRCLib(getLyricsData)).value;
    }

    useCacheStore.getState().saveLyrics(getLyricsData.id!, lyrics);
    return lyrics;
}

export async function getLyricsFromLRCLib(getLyricsData: GetLyricsData) {
    const { enableLRCLib } = useAppStore.getState().settings;
    const { isLms } = checkServerType();

    const { title, album, duration } = getLyricsData;

    // LMS server tends to join all artists into a single string
    // Ex: "Cartoon, Jeja, Daniel Levi, Time To Talk"
    // To LRCLIB work correctly, we have to send only one
    const artist = isLms
        ? getLyricsData.artist.split(",")[0]
        : getLyricsData.artist;

    if (!enableLRCLib) {
        return {
            artist,
            title,
            value: "",
        };
    }

    try {
        const params = new URLSearchParams({
            artist_name: artist,
            track_name: title,
        });

        if (duration) params.append("duration", duration.toString());
        if (album) params.append("album_name", album);

        const url = new URL("https://lrclib.net/api/get");
        url.search = params.toString();

        const request = await fetch(url.toString(), {
            headers: {
                "Lrclib-Client": lrclibClient,
            },
        });
        const response: LRCLibResponse = await request.json();

        if (response) {
            const { syncedLyrics, plainLyrics } = response;

            let finalLyric = "";

            if (syncedLyrics) {
                finalLyric = syncedLyrics;
            } else if (plainLyrics) {
                finalLyric = plainLyrics;
            }

            return {
                artist,
                title,
                value: formatLyrics(finalLyric),
            };
        }
    } catch {}

    return {
        artist,
        title,
        value: "",
    };
}

export async function getLyricsFromLyricOtter(getLyricsData: GetLyricsData) {

    const { isAppleMusic } = checkServerType();

    if (isAppleMusic && false) {
        const url = `https://rikka-prod.samsidparty.com/api/otter-focal/lyric/apple-music/${getLyricsData.id}?format=elrc-focalsonic`;
        //const url = `http://127.0.0.1:5271/api/otter-focal/lyric/apple-music/${getLyricsData.id}?format=elrc-focalsonic`;
        console.log("Fetching lyrics from Lyric Otter:", url);

        try {
            const request = await fetch(url);
            const response = await request.text();

            return {
                artist: getLyricsData.artist,
                album: getLyricsData.album || "",
                value: formatLyrics(response),
            };
        }
        catch {}
    }




    return {
        artist: "",
        album: "",
        value: "",
    };
}

function formatLyrics(lyrics: string) {
    return lyrics.trim().replaceAll("\r\n", "\n");
}

function convertToLRC(lyricsList?: ILyricsList) {

    const structuredLyrics = lyricsList?.structuredLyrics;
    if (!structuredLyrics?.length) {
        return null;
    }

    // Prioritize synced english lyrics if available
    const optimalLyrics = structuredLyrics.find((lyric) => lyric.synced) || structuredLyrics[0];
    let formattedLyrics = "";
  
    // Convert each line to LRC format
    optimalLyrics.line?.forEach((line) => {
        if (line.start !== undefined && line.value !== undefined) {
            const timeMS = (line.start + (optimalLyrics.offset || 0));
            const lrcTime = `[${String(Math.floor(timeMS / 60000)).padStart(2, "0")}:${String(Math.floor(timeMS / 1000) % 60).padStart(2, "0")}.${String(timeMS % 1000).padStart(3, "0")}]`;
            formattedLyrics += `${lrcTime}${line.value}\n`;
        }
    });

    return {
        value: formattedLyrics.trim()
    };
}

export const lyrics = {
    getLyrics,
    getLyricsFromLRCLib,
};
