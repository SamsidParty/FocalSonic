import { httpClient } from "@/api/httpClient";
import { AppleMusicSong, convertAppleMusicSongToSubsonic } from "@/types/applemusic/song";
import {
    GetSongResponse
} from "@/types/responses/song";

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
        query: {
            extend: "inFavorites",
        }
    });

    return response?.data?.map(convertAppleMusicSongToSubsonic);
}

async function getAllSongs(songCount: number) {
    const response = await httpClient<AppleMusicSong[]>("/applemusic/me/library/songs", {
        query: {
            limit: songCount,
        }
    });
    return response?.data.map(convertAppleMusicSongToSubsonic) ?? [];
}

async function getSong(id: string) {
    const response = await httpClient<GetSongResponse>("/getSong", {
        method: "GET",
        query: {
            id,
        },
    });

    return response?.data.song;
}

export const songs = {
    getAllSongs,
    getRandomSongs,
    getTopSongs,
    getSong,
};
