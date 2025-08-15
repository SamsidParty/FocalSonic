import { httpClient } from "@/api/httpClient";
import { AppleMusicAlbum, convertAppleMusicAlbumToSubsonic } from "@/types/applemusic/albums";
import {
    AlbumInfoResponse,
    AlbumListType
} from "@/types/responses/album";

export interface AlbumListParams {
    type: AlbumListType
    size?: number
    offset?: number
    fromYear?: string
    toYear?: string
    genre?: string
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

    const response = await httpClient<AppleMusicAlbum[]>(`/applemusic/me/library/albums`, {
        method: "GET",
        query: {
            limit: size.toString(),
            offset: offset.toString(),
        },
    });

    return {
        albumsCount: response?.count,
        list: response?.data.map(convertAppleMusicAlbumToSubsonic) || [],
    };
}

async function getOne(id: string) {

    if (!parseInt(id)) { // If it's not a catalog id, then it's a library id
        id = (await httpClient<AppleMusicAlbum[]>(`/applemusic/me/library/albums/${id}/catalog`, { method: "GET", }))?.data[0]?.id || null;
        if (!id) return;
    }

    let response = await httpClient<AppleMusicAlbum[]>(`/applemusic/catalog/{storefront}/albums/${id}`, { method: "GET", });
    
    if (!(response?.data?.length > 0)) {
        // Try again but with the song endpoint
        id = (await httpClient<AppleMusicAlbum[]>(`/applemusic/catalog/{storefront}/songs/${id}/albums`, { method: "GET", }))?.data[0]?.id || null;
        if (id) {
            return await getOne(id);
        }
    }

    return convertAppleMusicAlbumToSubsonic(response?.data[0]);
}

async function getInfo(id: string) {
    const response = await httpClient<AlbumInfoResponse>("/getAlbumInfo2", {
        method: "GET",
        query: {
            id,
        },
    });

    return response?.data.albumInfo;
}

export const albums = {
    getAlbumList,
    getOne,
    getInfo,
};
