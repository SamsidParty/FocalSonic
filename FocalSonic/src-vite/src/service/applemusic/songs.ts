import { httpClient } from "@/api/httpClient";
import { AppleMusicSong, convertAppleMusicSongToSubsonic } from "@/types/applemusic/song";
import {
    GetSongResponse,
    RandomSongsResponse,
    TopSongsResponse,
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
    const response = await httpClient<RandomSongsResponse>("/getRandomSongs", {
        method: "GET",
        query: {
            size: size?.toString(),
            genre,
            fromYear: fromYear?.toString(),
            toYear: toYear?.toString(),
        },
    });

    return response?.data.randomSongs.song;
}

async function getTopSongs(artistName: string) {
    const response = await httpClient<TopSongsResponse>("/getTopSongs", {
        method: "GET",
        query: {
            artist: artistName,
        },
    });

    return response?.data.topSongs.song;
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
