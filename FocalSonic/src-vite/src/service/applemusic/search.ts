import { httpClient } from "@/api/httpClient";
import { convertAppleMusicAlbumToSubsonic } from "@/types/applemusic/albums";
import { convertAppleMusicArtistToSubsonic } from "@/types/applemusic/artist";
import { convertAppleMusicPlaylistToSubsonic } from "@/types/applemusic/playlist";
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

    const types = [];
    artistCount > 0 && types.push("artists");
    albumCount > 0 && types.push("albums");
    songCount > 0 && types.push("songs");

    if (libraryOnly && !query) {
        const response = (await httpClient<AppleMusicSong[]>("/applemusic/me/library/songs", {
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
        };
    }
    else if (libraryOnly) {
        const response = (await httpClient<any>("/applemusic/me/library/search", {
            method: "GET",
            query: {
                term: query,
                limit: Math.min(25, Math.max(songCount, albumCount, artistCount)),
                offset: songOffset,
                types: types.map((type) => "library-" + type),
            },
        }))?.results;

        return {
            song: response["library-songs"]?.data.map(convertAppleMusicSongToSubsonic) || [],
            artist: response["library-artists"]?.data.map(convertAppleMusicArtistToSubsonic) || [],
            album: response["library-albums"]?.data.map(convertAppleMusicAlbumToSubsonic) || [],
        };
    }
    else {
        const response = (await httpClient<any>("/applemusic/catalog/{storefront}/search", {
            method: "GET",
            query: {
                "platform": "web",
                "term": query,
                "relate[editorial-items]": "contents",
                "include[editorial-items]": "contents",
                "include[albums]": "artists",
                "include[artists]": "artists",
                "include[songs]": "artists,albums",
                "include[music-videos]": "artists",
                "extend": "artistUrl",
                "fields[artists]": "url,name,artwork,hero",
                "fields[albums]": "artistName,artistUrl,artwork,contentRating,editorialArtwork,editorialVideo,name,playParams,releaseDate,url",
                "with": "serverBubbles,lyricHighlights",
                "omit[resource]": "autos",
                "types": "activities,albums,apple-curators,artists,curators,editorial-items,music-movies,music-videos,playlists,songs,stations,tv-episodes,uploaded-videos,record-labels",
                "limit": "25"
            },
        }))?.results;


        return {
            //top: response["top"]?.data.map(convertAppleMusicAlbumToSubsonic) || [], // Disabled for now
            song: response["song"]?.data.map(convertAppleMusicSongToSubsonic) || [],
            artist: response["artist"]?.data.map(convertAppleMusicArtistToSubsonic) || [],
            album: response["album"]?.data.map(convertAppleMusicAlbumToSubsonic) || [],
            playlist: response["playlist"]?.data.map(convertAppleMusicPlaylistToSubsonic) || [],
        };
    }
}

export const search = {
    get,
};
