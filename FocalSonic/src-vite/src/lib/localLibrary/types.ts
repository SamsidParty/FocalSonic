import { Albums } from "@/types/responses/album";
import { Playlist } from "@/types/responses/playlist";
import { ISong } from "@/types/responses/song";

/**
 * A song stored in the local library.
 *
 * Records keep the shape the app already consumes (`ISong`) so they can be handed
 * straight to the player/tables. Bookkeeping fields layered on top:
 *
 * - `albumKey`  groups songs into albums (Subsonic `albumId`; Apple Music library album id).
 * - `inLibrary` marks songs that belong to the user's library. Songs are transient
 *   by default — album/playlist tracks aren't guaranteed to be in the library — and
 *   only the library-songs sync flags them `inLibrary`.
 * - `syncedAt`  timestamp of the sync/import that produced the record.
 */
export interface LibrarySong extends ISong {
    albumKey: string
    inLibrary?: boolean
    syncedAt: number
}

/**
 * An album stored in the local library. `id` doubles as the grouping key that
 * matches `LibrarySong.albumKey`, so an album's tracks are the songs sharing it.
 */
export interface LibraryAlbum extends Albums {
    albumKey: string
    inLibrary?: boolean
    syncedAt: number
}

export type PlaylistPending = "create" | "update" | "remove"

/**
 * A playlist stored in the local library. Metadata is synced eagerly; the ordered
 * track list (`entryIds`, referencing songs in the songs store) is loaded lazily
 * on open. `pending` flags a local mutation not yet confirmed by the server.
 */
export interface LibraryPlaylist extends Playlist {
    entryIds?: string[]
    entriesLoaded?: boolean
    syncedAt: number
    pending?: PlaylistPending
}

export type FavoriteType = "song" | "album" | "artist"

/**
 * A favorited item. `starred` is the ISO date when it was favorited (undefined once
 * unfavorited but still pending a server push). `pending` marks a local change not
 * yet confirmed by the server.
 */
export interface FavoriteRecord {
    key: string
    id: string
    type: FavoriteType
    starred?: string
    syncedAt: number
    pending?: boolean
}

export function favoriteKey(type: FavoriteType, id: string): string {
    return `${type}:${id}`;
}

export const LIBRARY_DB_NAME = "focalsonic-library";
export const LIBRARY_DB_VERSION = 2;

export const STORE_SONGS = "songs";
export const STORE_ALBUMS = "albums";
export const STORE_PLAYLISTS = "playlists";
export const STORE_FAVORITES = "favorites";
export const STORE_META = "meta";

/** Key under which the owning server identity is stored in the meta store. */
export const META_SERVER_KEY = "serverKey";
/** Key under which the last successful full-sync timestamp is stored. */
export const META_LAST_SYNCED = "lastSyncedAt";
