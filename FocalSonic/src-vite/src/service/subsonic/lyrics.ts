import { httpClient } from "@/api/httpClient";
import { useAppStore } from "@/store/app.store";
import { useCacheStore } from "@/store/cache.store";
import { ILyricsList, LyricsResponse, OpenLyricsResponse } from "@/types/responses/song";
import { lrclibClient } from "@/utils/appName";
import { checkServerType } from "@/utils/servers";

const MUSIXMATCH_TOKEN = "2203269256b9d8c343bc4c2cde8e6b21";

// Routes external requests through the IgniteView resolver to bypass WebView2 CORS restrictions.
// Requires a /proxy?url= route on the C# resolver server.
// Falls back to direct fetch outside the native app (where CORS may apply).
function proxyFetch(url: string, init?: RequestInit): Promise<Response> {
    if (window.igniteView?.resolverURL) {
        return fetch(`${window.igniteView.resolverURL}/proxy?${encodeURIComponent(url)}`, init);
    }
    return fetch(url, init);
}

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

    if (!lyrics) {
        lyrics = (await getLyricsFromMusixmatch(getLyricsData)).value;
    }

    if (!lyrics) {
        lyrics = (await getLyricsFromNetEase(getLyricsData)).value;
    }

    if (!lyrics) {
        lyrics = (await getLyricsFromGenius(getLyricsData)).value;
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

        if (!request.ok) {
            return { artist, title, value: "" };
        }

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

export async function getLyricsFromMusixmatch(getLyricsData: GetLyricsData) {
    const { artist, title } = getLyricsData;
    const BASE = "https://apic-desktop.musixmatch.com/ws/1.1";

    try {
        const searchParams = new URLSearchParams({
            q_track: title,
            q_artist: artist,
            f_has_lyrics: "1",
            format: "json",
            app_id: "web-desktop-app-v1.0",
            usertoken: MUSIXMATCH_TOKEN,
        });

        const searchResp = await fetch(`${BASE}/track.search?${searchParams}`);
        const searchData = await searchResp.json();
        const trackId = searchData?.message?.body?.track_list?.[0]?.track?.track_id;
        if (!trackId) return { artist, title, value: "" };

        const subtitleParams = new URLSearchParams({
            track_id: String(trackId),
            subtitle_format: "lrc",
            format: "json",
            app_id: "web-desktop-app-v1.0",
            usertoken: MUSIXMATCH_TOKEN,
        });

        const subtitleResp = await fetch(`${BASE}/track.subtitle.get?${subtitleParams}`);
        const subtitleData = await subtitleResp.json();
        const subtitle = subtitleData?.message?.body?.subtitle?.subtitle_body;
        if (subtitle) return { artist, title, value: formatLyrics(subtitle) };

        const lyricsParams = new URLSearchParams({
            track_id: String(trackId),
            format: "json",
            app_id: "web-desktop-app-v1.0",
            usertoken: MUSIXMATCH_TOKEN,
        });

        const lyricsResp = await fetch(`${BASE}/track.lyrics.get?${lyricsParams}`);
        const lyricsData = await lyricsResp.json();
        const lyricsBody = lyricsData?.message?.body?.lyrics?.lyrics_body;
        if (lyricsBody) return { artist, title, value: formatLyrics(lyricsBody) };
    } catch {}

    return { artist, title, value: "" };
}

export async function getLyricsFromNetEase(getLyricsData: GetLyricsData) {
    const { artist, title } = getLyricsData;

    try {
        const searchResp = await proxyFetch(
            `https://music.163.com/api/search/get?s=${encodeURIComponent(`${title} ${artist}`)}&type=1&limit=1`
        );
        const searchData = await searchResp.json();
        const songId = searchData?.result?.songs?.[0]?.id;
        if (!songId) return { artist, title, value: "" };

        const lyricsResp = await proxyFetch(
            `https://music.163.com/api/song/lyric?id=${songId}&lv=1&kv=1&tv=-1`
        );
        const lyricsData = await lyricsResp.json();
        const lrc = lyricsData?.lrc?.lyric;
        if (lrc) return { artist, title, value: formatLyrics(lrc) };
    } catch {}

    return { artist, title, value: "" };
}

export async function getLyricsFromGenius(getLyricsData: GetLyricsData) {
    const { artist, title } = getLyricsData;

    try {
        const searchResp = await proxyFetch(
            `https://genius.com/api/search?q=${encodeURIComponent(`${artist} ${title}`)}`
        );
        const searchData = await searchResp.json();
        const hit = searchData?.response?.hits?.find((h: { type: string }) => h.type === "song");
        if (!hit) return { artist, title, value: "" };

        const pageResp = await proxyFetch(`https://genius.com${hit.result.path}`);
        const html = await pageResp.text();

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        const containers = doc.querySelectorAll("[data-lyrics-container='true']");
        if (!containers.length) return { artist, title, value: "" };

        const lyricsLines: string[] = [];
        containers.forEach((container) => {
            const clone = container.cloneNode(true) as Element;
            clone.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
            lyricsLines.push(clone.textContent ?? "");
        });

        const value = lyricsLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
        if (value) return { artist, title, value };
    } catch {}

    return { artist, title, value: "" };
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
    getLyricsFromMusixmatch,
    getLyricsFromNetEase,
    getLyricsFromGenius,
};
