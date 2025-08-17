import { httpClient } from "@/api/httpClient";
import { AppleMusicArtist, convertAppleMusicArtistToSubsonic } from "@/types/applemusic/artist";
import {
    ArtistInfoResponse
} from "@/types/responses/artist";

async function getAll() {
    const response = await httpClient<AppleMusicArtist[]>(
        "/applemusic/me/library/artists",
        {
            method: "GET",
            query: {
                "art[url]": "f",
                "format[resources]": "map",
                "include": "catalog",
                "limit": "100",
                "meta": "sorts",
                "offset": "0",
                "sort": "name"
            }
        }
    );

    return Object.values(response?.resources?.artists || {})?.map(convertAppleMusicArtistToSubsonic);
}

async function getOne(id: string) {
    let response = await httpClient<AppleMusicArtist[]>(
        `/applemusic/me/library/artists/${id}`,
        {
            method: "GET",
            query: {
                extend: "inFavorites"
            }
        }
    );

    if (!response || response?.data.length === 0) {
        // Try again but this time in the catalog not the library
        response = await httpClient<AppleMusicArtist[]>(`/applemusic/catalog/{storefront}/artists/${id}`, {
            method: "GET",
            query: {
                extend: "inFavorites"
            }
        });
    }

    return convertAppleMusicArtistToSubsonic(response?.data[0]) || null;
}

async function getInfo(id: string) {
    const response = await httpClient<ArtistInfoResponse>("/getArtistInfo", {
        method: "GET",
        query: {
            id,
        },
    });

    return response?.data.artistInfo;
}

export const artists = {
    getOne,
    getInfo,
    getAll,
};
