import { httpClient } from "@/api/httpClient";
import { AppleMusicAlbum } from "@/types/applemusic/albums";
import { AppleMusicSong, convertAppleMusicSongToSubsonic } from "@/types/applemusic/song";
import { merge } from "lodash";
import { defaultAppleMusicQuery } from "./common";

interface GetRandomSongsParams {
    size?: number
    genre?: string
    fromYear?: number
    toYear?: number
}

async function getRandomSongs({
    size,
    genre,
    fromYear,
    toYear,
}: GetRandomSongsParams) {
    return [];
}

async function getTopSongs(artistID: string) {
    const response = await httpClient<AppleMusicSong[]>(`/applemusic/catalog/{storefront}/artists/${artistID}/view/top-songs`, {
        method: "GET",
        query: merge({}, defaultAppleMusicQuery)
    });

    return response?.data?.map(convertAppleMusicSongToSubsonic);
}

async function getAllSongs(songCount: number) {
    const response = await httpClient<AppleMusicSong[]>("/applemusic/me/library/songs", {
        query: merge({
            limit: songCount,
        }, defaultAppleMusicQuery)
    });
    return response?.data.map(convertAppleMusicSongToSubsonic) ?? [];
}

async function getSong(id: string) {
    let response: AppleMusicSong[];

    if (!parseInt(id)) { // If it's not a catalog id, then it's a library id
        response = (await httpClient<AppleMusicSong[]>(
            `/applemusic/me/library/songs/${id}`, 
            {
                method: "GET",
                query: merge({}, defaultAppleMusicQuery)  
            }
        ))?.data;
    }
    else {
        response = (await httpClient<AppleMusicSong[]>(
            `/applemusic/catalog/{storefront}/songs/${id}`, 
            {
                method: "GET",
                query: merge({ }, defaultAppleMusicQuery)
            }
        ))?.data;
    }


    return convertAppleMusicSongToSubsonic(response?.[0], null);
}

async function getAnimatedCoverArt(id: string, type: "songs" | "albums" = "songs") : Promise<string | null> {

    if (window?.igniteView?.commandBridge?.getCustomOverride) {
        const cachedURL = await window.igniteView.commandBridge.getCustomOverride("AppleEditorialVideos", id);
        if (cachedURL) {
            return cachedURL !== "none" ? cachedURL : null;
        }
    }

    const response = (await httpClient<any>(
        `/applemusic/catalog/{storefront}/${type}/${id}`, 
        {
            method: "GET",
            query: {
                "art[url]": "f",
                "extend": "editorialArtwork,editorialVideo,extendedAssetUrls,offers,seoDescription,seoTitle",
                "fields[artists]": "name,url",
                "fields[curators]": "name",
                "fields[record-labels]": "name,url",
                "format[resources]": "map",
                "include": "record-labels,artists",
                "include[music-videos]": "artists",
                "include[playlists]": "curator",
                "include[songs]": "artists,composers,albums",
                "l": "en-US",
                "meta[albums:tracks]": "popularity",
                "platform": "web",
                "views": "appears-on,audio-extras,more-by-artist,other-versions,related-videos,video-extras,you-might-also-like"
            }
        }
    ))?.resources?.albums;

    let firstAlbum = response?.[id] as AppleMusicAlbum;

    if (!firstAlbum) {
        firstAlbum = Object.values(response || {})?.[0] as AppleMusicAlbum;
    }

    const editorialVideo = firstAlbum?.attributes.editorialVideo;
    const url = editorialVideo?.motionDetailSquare?.video || "none"; // Save as none instead of null so that we can cache the asset as none existent

    if (window?.igniteView?.commandBridge?.saveCustomOverride && url) {
        await window.igniteView.commandBridge.saveCustomOverride("AppleEditorialVideos", id, url);
    }

    return url !== "none" ? url : null;
}

export const songs = {
    getAllSongs,
    getRandomSongs,
    getTopSongs,
    getSong,
    getAnimatedCoverArt,
};
