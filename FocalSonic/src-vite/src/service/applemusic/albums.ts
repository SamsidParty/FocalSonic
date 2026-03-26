import { httpClient } from "@/api/httpClient";
import { AppleMusicAlbum, convertAppleMusicAlbumToSubsonic } from "@/types/applemusic/albums";
import {
    AlbumInfoResponse
} from "@/types/responses/album";
import { merge } from "lodash";
import { AlbumListParams } from "../subsonic/albums";
import { defaultAppleMusicQuery } from "./common";

async function resolveTracks(href: string) {
    const targetURL = href.replace("/v1/", "/applemusic/");

    const response = await httpClient<any>(targetURL, {
        method: "GET",
        query: merge({}, defaultAppleMusicQuery),
    });

    if (response?.next) {
        response.data.push(...(await resolveTracks(response.next)).data);
    }

    return response;
}


async function getAlbumList(params: Partial<AlbumListParams> = {}) {
    const {
        type = "newest",
        size = 30,
        offset = 0,
        fromYear,
        toYear,
        genre,
    } = params;

    const sortValues = {
        "newest": "-dateAdded",
        "alphabeticalByName": "name"
    };

    const response = await httpClient<AppleMusicAlbum[]>("/applemusic/me/library/albums", {
        method: "GET",
        query: merge({
            limit: size.toString(),
            offset: offset.toString(),
            sort: sortValues[type] || "-dateAdded"
        }, defaultAppleMusicQuery),
    });

    if (type === "starred" && response?.data?.length > 0) {
        response.data = response.data.filter((album) => album?.attributes?.inFavorites);
    }

    return {
        albumsCount: response?.count,
        list: response?.data.map(convertAppleMusicAlbumToSubsonic) || [],
    };
}

async function getOne(id: string) {
    if (!parseInt(id)) { // If it's not a catalog id, then it's a library id
        id = (await httpClient<AppleMusicAlbum[]>(`/applemusic/me/library/albums/${id}/catalog`, { method: "GET", }))?.data[0]?.id || id;
    }

    let baseURL = "/applemusic/catalog/{storefront}";

    if (!parseInt(id)) { // If not resolved to a catalog id successfully
        baseURL = "/applemusic/me/library";
    }

    const response = await httpClient<AppleMusicAlbum[]>(
        `${baseURL}/albums/${id}`, 
        {
            method: "GET",
            query: merge({
                include: "tracks",
                views: "appears-on,more-by-artist,other-versions,you-might-also-like"
            }, defaultAppleMusicQuery)
        }
    );

    const album = response?.data?.[0];

    if (album?.relationships?.tracks?.next) {
        const resolvedTracks = await resolveTracks(album.relationships.tracks.href || album.relationships.tracks.next);
        album.relationships.tracks.data = resolvedTracks?.data || album.relationships.tracks.data;
    }
    
    if (!(response?.data?.length > 0)) {
        // Try again but with the song endpoint
        id = (await httpClient<AppleMusicAlbum[]>(`${baseURL}/songs/${id}/albums`, { method: "GET", }))?.data[0]?.id || null;
        if (id) {
            return await getOne(id);
        }
    }

    return convertAppleMusicAlbumToSubsonic(album);
}

async function getInfo(id: string) {
    const response = await httpClient<AlbumInfoResponse>("/getAlbumInfo2", {
        method: "GET",
        query: merge({
            id,
        }, defaultAppleMusicQuery),
    });

    return response?.data.albumInfo;
}

export const albums = {
    getAlbumList,
    getOne,
    getInfo,
};
