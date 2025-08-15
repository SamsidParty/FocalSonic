import { httpClient } from "@/api/httpClient";
import { convertAppleMusicAlbumToSubsonic } from "@/types/applemusic/albums";
import { AppleMusicSong, convertAppleMusicSongToSubsonic } from "@/types/applemusic/song";
import { SearchQueryOptions } from "../subsonic/search";

async function get({
    query = "",
    artistCount = 20,
    artistOffset = 0,
    albumCount = 20,
    albumOffset = 0,
    songCount = 20,
    songOffset = 0,
    libraryOnly = false,
}: SearchQueryOptions) {

    let types = [];
    artistCount > 0 && types.push("artists");
    albumCount > 0 && types.push("albums");
    songCount > 0 && types.push("songs");

    if (libraryOnly && !query) {
        let response = (await httpClient<AppleMusicSong[]>("/applemusic/me/library/songs", {
            method: "GET",
            query: {
                limit: songCount,
                offset: songOffset,
            },
        }))?.data;

        return {
            song: response?.map(convertAppleMusicSongToSubsonic) || [],
            artist: [],
            album: [],
        }
    }
    else if (libraryOnly) {
        let response = (await httpClient<any>("/applemusic/me/library/search", {
            method: "GET",
            query: {
                term: query,
                limit: songCount,
                offset: songOffset,
                types: types.map((type) => "library-" + type),
            },
        }))?.data?.results;

        return {
            song: response["library-songs"]?.data.map(convertAppleMusicSongToSubsonic) || [],
            artist: response["library-artists"]?.data.map(convertAppleMusicSongToSubsonic) || [],
            album: response["library-albums"]?.data.map(convertAppleMusicAlbumToSubsonic) || [],
        }
    }
}

export const search = {
    get,
};
