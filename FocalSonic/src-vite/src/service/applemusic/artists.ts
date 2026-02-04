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

    let url = `/applemusic/me/library/artists/${id}`;

    if (id.startsWith("authorof_songs:")) {
        url = `/applemusic/catalog/{storefront}/songs/${id.replace("authorof_songs:", "")}/artists`;
    }
    else if (id.startsWith("authorof_albums:")) {
        url = `/applemusic/catalog/{storefront}/albums/${id.replace("authorof_albums:", "")}/artists`;
    }
    else if (id.startsWith("authorof_library-albums:")) {
        url = `/applemusic/me/library/albums/${id.replace("authorof_library-albums:", "")}/artists`;
    }

    const query = { 
        "extend": "centeredFullscreenBackground,artistBio,bornOrFormed,editorialArtwork,editorialVideo,isGroup,origin,hero,inFavorites",
        "views": "featured-release,full-albums,appears-on-albums,featured-albums,featured-on-albums,singles,compilation-albums,live-albums,latest-release,similar-artists,top-songs,playlists",
        "platform": "web"
    };

    let response = await httpClient<AppleMusicArtist[]>(
        url,
        {
            method: "GET",
            query: merge(query, defaultAppleMusicQuery)
        }
    );

    if (!response || response?.data.length === 0) {
        // Try again but this time in the catalog not the library
        response = await httpClient<AppleMusicArtist[]>(`/applemusic/catalog/{storefront}/artists/${id}`, {
            method: "GET",
            query: merge(query, defaultAppleMusicQuery)
        });
    }

    return convertAppleMusicArtistToSubsonic(response?.data[0], response) || null;
}

async function getInfo(id: string) {
    return await getOne(id);
}

export const artists = {
    getOne,
    getInfo,
    getAll,
};
