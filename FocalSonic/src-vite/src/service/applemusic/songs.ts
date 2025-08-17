import { httpClient } from "@/api/httpClient";
import { AppleMusicArtist } from "@/types/applemusic/artist";
import { AppleMusicSong, convertAppleMusicSongToSubsonic } from "@/types/applemusic/song";
import {
    GetSongResponse,
    RandomSongsResponse
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

async function getTopSongs(artistID: string) {
    const response = await httpClient<AppleMusicArtist[]>(`/applemusic/catalog/{storefront}/artists/${artistID}/view/top-songs`, {
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
