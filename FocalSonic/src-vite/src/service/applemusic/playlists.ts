import { httpClient } from "@/api/httpClient";
import { AppleMusicPlaylist, convertAppleMusicPlaylistToSubsonic } from "@/types/applemusic/playlist";
import {
    CreateParams,
    UpdateParams
} from "@/types/responses/playlist";
import { SubsonicResponse } from "@/types/responses/subsonicResponse";
import { merge } from "lodash";
import { defaultAppleMusicQuery } from "./common";

async function getAll() {
    const response = await httpClient<AppleMusicPlaylist[]>("/applemusic/me/library/playlists", { 
        method: "GET",
        query: defaultAppleMusicQuery
    });

    const listData = response?.data || [];

    if (response?.next) {
        const resolvedPlaylists = await resolvePlaylists(response.next);
        listData.push(...resolvedPlaylists.data);
    }

    return listData.map(convertAppleMusicPlaylistToSubsonic) ?? [];
}

async function resolvePlaylists(href: string) {
    const targetURL = href.replace("/v1/", "/applemusic/");

    const response = await httpClient<any>(targetURL, {
        method: "GET",
        query: merge({}, defaultAppleMusicQuery)
    });

    if (response?.next) {
        response.data.push(...(await resolveTracks(response.next)).data); // Recursively fetch next pages
    }

    return response;
}

async function getOne(id: string, offset?: number) {

    let response = await httpClient<AppleMusicPlaylist[]>(
        `/applemusic/me/library/playlists/${id}`,
        {
            method: "GET",
            query: merge({ include: "tracks" }, defaultAppleMusicQuery)
        }
    );

    if (!response || response?.data.length === 0) {
        // Try again but this time in the catalog not the library
        response = await httpClient<AppleMusicPlaylist[]>(`/applemusic/catalog/{storefront}/playlists/${id}`, {
            method: "GET",
            query: merge({ include: "tracks" }, defaultAppleMusicQuery)
        });
    }

    const playlistData = response?.data[0];

    if (playlistData.attributes.trackCount > 99) {
        const resolvedTracks = await resolveTracks(playlistData.relationships?.tracks?.href || "");
        playlistData.relationships!.tracks!.data = resolvedTracks.data;
    }

    const tracks = convertAppleMusicPlaylistToSubsonic(playlistData) || null;

    return tracks;
}

async function resolveTracks(href: string) {
    const targetURL = href.replace("/v1/", "/applemusic/");

    const response = await httpClient<any>(targetURL, {
        method: "GET",
        query: merge({}, defaultAppleMusicQuery)
    });

    if (response?.next) {
        response.data.push(...(await resolveTracks(response.next)).data); // Recursively fetch next pages
    }

    return response;
}

async function remove(id: string) {
    const response = await httpClient<SubsonicResponse>(`/applemusic/me/library/playlists/${id}`, {
        method: "DELETE",
        query: {
            "art[url]": "f",
        },
    });

    if (response === undefined) { throw new Error(); }
}

async function create(name: string, songs?: string[]) {

    const response = await httpClient<AppleMusicPlaylist[]>(
        "/applemusic/me/library/playlists",
        {
            method: "POST",
            body: JSON.stringify(
                {
                    attributes: {
                        name: name,
                        description: "",
                        isPublic: false
                    },
                    relationships: {
                        tracks: {
                            data: songs?.map((id) => ({
                                id,
                                type: "library-songs"
                            }))
                        }
                    }
                }
            )
        }
    );

    if (!response?.data[0]) { throw new Error("Failed to create playlist"); }

    return convertAppleMusicPlaylistToSubsonic(response?.data[0]); 

}

async function update({
    playlistId,
    name,
    comment,
    songIdToAdd,
    songIndexToRemove,
    isPublic,
}: UpdateParams) {

    let response;

    if (name || comment || isPublic) {
        response = await httpClient<AppleMusicPlaylist[]>(
            `/applemusic/me/library/playlists/${playlistId}`,
            {
                method: "PATCH",
                body: JSON.stringify({
                    attributes: {
                        name,
                        description: comment,
                        isPublic
                    }
                }),
                query: {
                    "art[url]": "f",
                    "format[resources]": "map",
                }
            }
        );
    }

    if (songIdToAdd) {
        response = await httpClient<AppleMusicPlaylist[]>(
            `/applemusic/me/library/playlists/${playlistId}/tracks`,
            {
                method: "POST",
                body: JSON.stringify({
                    data: (Array.isArray(songIdToAdd) ? songIdToAdd : [songIdToAdd]).map((id) => ({
                        id,
                        type: "library-songs"
                    }))
                })
            }
        );
    }

    if (songIndexToRemove) {
        response = await httpClient(
            `/applemusic/me/library/playlists/${playlistId}/tracks`,
            {
                method: "DELETE",
                query: {
                    "ids[library-songs]": Array.isArray(songIndexToRemove) ? songIndexToRemove[0] : songIndexToRemove,
                    "art[url]": "f",
                    mode: "all",
                }
            }
        );
    }

    if (response === undefined) { throw new Error(); }
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
    resolveTracks,
    update,
};
