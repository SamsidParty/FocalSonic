import { Albums } from "@/types/responses/album";
import { ISong } from "@/types/responses/song";

/**
 * A song stored in the local library.
 *
 * Records are kept as the same shape the rest of the app already consumes
 * (`ISong`) so they can be handed straight to the player/tables without any
 * extra conversion. A handful of bookkeeping fields are layered on top:
 *
 * - `albumKey`  groups songs into albums. For Subsonic this is the real
 *   `albumId`; for Apple Music it's the *library* album id (catalog and
 *   library ids differ), resolved from `include=albums` on the sync request.
 * - `transient` marks songs that were pulled in on-demand while viewing an
 *   album whose tracks aren't all in the user's library. They're persisted so
 *   the album loads instantly next time, but are hidden from library views.
 * - `syncedAt`  timestamp of the sync/import that produced the record.
 */
export interface LibrarySong extends ISong {
    albumKey: string
    transient?: boolean
    syncedAt: number
}

/**
 * An album stored in the local library. `id` doubles as the grouping key that
 * matches `LibrarySong.albumKey` (Subsonic album id / Apple Music library
 * album id), so an album's tracks are simply the songs sharing that key.
 */
export interface LibraryAlbum extends Albums {
    albumKey: string
    transient?: boolean
    syncedAt: number
}

export const LIBRARY_DB_NAME = "focalsonic-library";
export const LIBRARY_DB_VERSION = 1;

export const STORE_SONGS = "songs";
export const STORE_ALBUMS = "albums";
export const STORE_META = "meta";

/** Key under which the owning server identity is stored in the meta store. */
export const META_SERVER_KEY = "serverKey";
/** Key under which the last successful full-sync timestamp is stored. */
export const META_LAST_SYNCED = "lastSyncedAt";
