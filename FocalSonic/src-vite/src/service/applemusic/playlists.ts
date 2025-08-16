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

    if (songIdToAdd) {
        if (typeof songIdToAdd === "string" || (Array.isArray(songIdToAdd)) && songIdToAdd.length === 1) {
            let response = await httpClient<AppleMusicPlaylist[]>(`/applemusic/me/library/playlists/${playlistId}/tracks`,
            { 
                method: "POST",
                body: JSON.stringify({
                    id: Array.isArray(songIdToAdd) ? songIdToAdd[0] : songIdToAdd,
                    type: "library-songs"
                })
            });
        } else {

        }
    }
    if (songIndexToRemove) {
        let response = await httpClient(`/applemusic/me/library/playlists/${playlistId}/tracks`,
        { 
            method: "DELETE",
            query: {
                "ids[library-songs]": Array.isArray(songIndexToRemove) ? songIndexToRemove[0] : songIndexToRemove,
                "art[url]": "f",
                mode: "all",
            }
        });

        if (response === undefined) {
            throw new Error();
        }
    }

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
