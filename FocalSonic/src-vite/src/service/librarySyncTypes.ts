import { Albums } from "@/types/responses/album";
import { ISong } from "@/types/responses/song";

/** A library song paired with the album-grouping key the sync engine should store. */
export type SyncSong = ISong & { albumKey: string }

export interface LibrarySongsPage {
    songs: SyncSong[]
    /** Albums discovered alongside these songs (Apple Music); empty for Subsonic. */
    albums: Albums[]
    /** Total library songs if the server reports it, else null (engine falls back). */
    total: number | null
}

export interface LibraryAlbumsPage {
    albums: Albums[]
    total: number | null
}

/**
 * Provider-agnostic library source consumed by the sync engine. Apple Music
 * carries album metadata on the song request (`include=albums`), so it derives
 * albums from songs; Subsonic exposes a dedicated album endpoint, so it runs a
 * separate album pass.
 */
export interface LibrarySyncSource {
    songPageSize: number
    fetchSongsPage(offset: number, limit: number): Promise<LibrarySongsPage>

    /** Whether albums need their own pagination pass (Subsonic) vs. derived from songs (Apple). */
    hasAlbumPass: boolean
    albumPageSize?: number
    fetchAlbumsPage?(offset: number, limit: number): Promise<LibraryAlbumsPage>
}
