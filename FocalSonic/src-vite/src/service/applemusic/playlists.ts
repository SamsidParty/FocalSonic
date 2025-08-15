import { httpClient } from "@/api/httpClient";
import { AppleMusicPlaylist, convertAppleMusicPlaylistToSubsonic } from "@/types/applemusic/playlist";
import {
    CreateParams,
    SinglePlaylistResponse,
    UpdateParams
} from "@/types/responses/playlist";
import { SubsonicResponse } from "@/types/responses/subsonicResponse";

async function getAll() {
    const response = await httpClient<AppleMusicPlaylist[]>("/applemusic/me/library/playlists", { method: "GET", });

    return response?.data.map(convertAppleMusicPlaylistToSubsonic) ?? [];
}

async function getOne(id: string) {
    let response = await httpClient<AppleMusicPlaylist[]>(`/applemusic/me/library/playlists/${id}`,
    { 
        method: "GET",
        query: {
            include: "tracks"
        }
    });

    if (response?.data.length === 0) {
        // Try again but this time in the catalog not the library
        response = await httpClient<AppleMusicPlaylist[]>(`/applemusic/catalog/{storefront}/playlists/${id}`, {
            method: "GET",
            query: {
                include: "tracks"
            }
        });
    }

    return convertAppleMusicPlaylistToSubsonic(response?.data[0]) || null;
}

async function remove(id: string) {
    await httpClient<SubsonicResponse>("/deletePlaylist", {
        method: "DELETE",
        query: {
            id,
        },
    });
}

async function create(name: string, songs?: string[]) {
    const query = new URLSearchParams();
    query.append("name", name);

    if (songs) {
        songs.forEach((song) => query.append("songId", song));
    }

    const response = await httpClient<SinglePlaylistResponse>(
        `/createPlaylist?${query.toString()}`,
        {
            method: "GET",
        },
    );

    return response?.data.playlist;
}

async function update({
    playlistId,
    name,
    comment,
    songIdToAdd,
    songIndexToRemove,
    isPublic,
}: UpdateParams) {
    const query = new URLSearchParams({
        playlistId,
    });
    if (name) query.append("name", name);
    if (comment) query.append("comment", comment);
    if (isPublic) query.append("public", isPublic);

    if (songIdToAdd) {
        if (typeof songIdToAdd === "string") {
            query.append("songIdToAdd", songIdToAdd);
        } else {
            songIdToAdd.forEach((songId) => query.append("songIdToAdd", songId));
        }
    }

    if (songIndexToRemove) {
        if (typeof songIndexToRemove === "string") {
            query.append("songIndexToRemove", songIndexToRemove);
        } else {
            songIndexToRemove.forEach((songIndex) =>
                query.append("songIndexToRemove", songIndex),);
        }
    }

    await httpClient<SubsonicResponse>(`/updatePlaylist?${query.toString()}`, {
        method: "GET",
    });
}

export async function createWithDetails(data: CreateParams) {
    const playlist = await create(data.name);

    if (playlist) {
        await update({
            playlistId: playlist.id,
            comment: data.comment,
            isPublic: data.isPublic,
            songIdToAdd: data.songIdToAdd,
        });
    }
}

export const playlists = {
    getAll,
    getOne,
    remove,
    create,
    createWithDetails,
    update,
};
