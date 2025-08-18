import { httpClient } from "@/api/httpClient";
import { AppleMusicSong, convertAppleMusicSongToSubsonic } from "@/types/applemusic/song";
import {
    GetSongResponse
} from "@/types/responses/song";
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
    const response = await httpClient<GetSongResponse>("/getSong", {
        method: "GET",
        query: merge({
            id,
        }, defaultAppleMusicQuery),
    });

    return response?.data.song;
}

export const songs = {
    getAllSongs,
    getRandomSongs,
    getTopSongs,
    getSong,
};
