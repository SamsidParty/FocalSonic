import { httpClient } from "@/api/httpClient";
import { useAppStore } from "@/store/app.store";
import { AlbumListResponse } from "@/types/responses/album";
import { ISearchResponse } from "@/types/responses/search";
import { SubsonicResponse } from "@/types/responses/subsonicResponse";
import {
    FavoriteItem,
    FavoritesPage,
    LibraryAlbumsPage,
    LibrarySongsPage,
    LibrarySyncSource,
    SyncSong,
} from "../librarySyncTypes";

interface Starred2 {
    song?: FavoriteItem[]
    album?: FavoriteItem[]
    artist?: FavoriteItem[]
}
type Starred2Response = SubsonicResponse<{ starred2: Starred2 }>

// Subsonic has no documented page cap; 500 keeps round trips low without
// tripping server limits. Albums are lighter, so they use a larger page.
const SONG_PAGE_SIZE = 500;
const ALBUM_PAGE_SIZE = 500;

/** Treat a missing/zero x-total-count header as "unknown" so the engine can probe. */
function normalizeTotal(count: number | undefined): number | null {
    return count && count > 0 ? count : null;
}

async function fetchSongsPage(offset: number, limit: number): Promise<LibrarySongsPage> {
    // Navidrome wants a quoted empty string to mean "everything"; others want "".
    const serverType = useAppStore.getState().data.serverType;
    const searchAllQuery = serverType === "navidrome" ? "\"\"" : "";

    const response = await httpClient<ISearchResponse>("/search3", {
        method: "GET",
        query: {
            query: searchAllQuery,
            artistCount: "0",
            albumCount: "0",
            songCount: limit.toString(),
            songOffset: offset.toString(),
        },
    });

    const data = response?.data.searchResult3.song ?? [];

    const songs: SyncSong[] = data.map((song) => ({ ...song, albumKey: song.albumId }));

    return { songs, albums: [], total: normalizeTotal(response?.count) };
}

async function fetchAlbumsPage(offset: number, limit: number): Promise<LibraryAlbumsPage> {
    const response = await httpClient<AlbumListResponse>("/getAlbumList2", {
        method: "GET",
        query: {
            type: "alphabeticalByName",
            size: limit.toString(),
            offset: offset.toString(),
        },
    });

    return {
        albums: response?.data.albumList2.album ?? [],
        total: normalizeTotal(response?.count),
    };
}

async function fetchFavorites(): Promise<FavoritesPage> {
    const response = await httpClient<Starred2Response>("/getStarred2", { method: "GET" });
    const starred = response?.data.starred2;

    const map = (items?: FavoriteItem[]): FavoriteItem[] =>
        (items ?? []).map((item) => ({ id: item.id, starred: item.starred }));

    return {
        songs: map(starred?.song),
        albums: map(starred?.album),
        artists: map(starred?.artist),
    };
}

export const librarySync: LibrarySyncSource = {
    songPageSize: SONG_PAGE_SIZE,
    fetchSongsPage,
    hasAlbumPass: true,
    albumPageSize: ALBUM_PAGE_SIZE,
    fetchAlbumsPage,
    fetchFavorites,
};
