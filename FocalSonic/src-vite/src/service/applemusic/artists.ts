import { httpClient } from "@/api/httpClient";
import { AppleMusicArtist, convertAppleMusicArtistToSubsonic } from "@/types/applemusic/artist";
import { merge } from "lodash";
import { defaultAppleMusicQuery } from "./common";

async function getAll() {

    const response = await httpClient<AppleMusicArtist[]>(
        "/applemusic/me/library/artists",
        {
            method: "GET",
            query: merge({
                "format[resources]": "map",
                "include": "catalog",
                "limit": "100",
                "meta": "sorts",
                "offset": "0",
                "sort": "name"
            }, defaultAppleMusicQuery)
        }
    );

    return Object.values(response?.resources?.artists || {})?.map(convertAppleMusicArtistToSubsonic);
}

async function getOne(id: string) {
    let response = await httpClient<AppleMusicArtist[]>(
        `/applemusic/me/library/artists/${id}`,
        {
            method: "GET",
            query: merge({}, defaultAppleMusicQuery)
        }
    );

    if (!response || response?.data.length === 0) {
        // Try again but this time in the catalog not the library
        response = await httpClient<AppleMusicArtist[]>(`/applemusic/catalog/{storefront}/artists/${id}`, {
            method: "GET",
            query: merge({}, defaultAppleMusicQuery)
        });
    }

    return convertAppleMusicArtistToSubsonic(response?.data[0]) || null;
}

async function getInfo(id: string) {
    return {};
}

export const artists = {
    getOne,
    getInfo,
    getAll,
};
