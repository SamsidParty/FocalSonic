import { Albums } from "@/types/responses/album";
import { ISong } from "@/types/responses/song";
import { AlbumsFilters, YearSortOptions } from "@/utils/albumsFilter";
import {
    clearAllStores,
    getAll,
    getMeta,
    putAll,
    putMeta,
    replaceAll,
} from "./db";
import {
    LibraryAlbum,
    LibrarySong,
    META_LAST_SYNCED,
    META_SERVER_KEY,
    STORE_ALBUMS,
    STORE_SONGS,
} from "./types";

/**
 * High-level, in-memory-cached view over the IndexedDB-backed local library.
 *
 * The whole (non-transient) library is small enough to keep resident, so reads
 * are synchronous array operations — instant sorting/searching/grouping without
 * the ~500ms server round trips. IndexedDB is the persistence layer; this module
 * is the query layer. Writers update IndexedDB then refresh the in-memory cache
 * and bump a version number that React Query keys subscribe to.
 */

let songs: LibrarySong[] = [];
let albums: LibraryAlbum[] = [];
let songsById = new Map<string, LibrarySong>();
let albumsById = new Map<string, LibraryAlbum>();

let version = 0;
let initPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

function reindex() {
    songsById = new Map(songs.map((s) => [s.id, s]));
    albumsById = new Map(albums.map((a) => [a.id, a]));
}

function notify() {
    version++;
    listeners.forEach((listener) => listener());
}

/** Subscribe to library mutations (sync completion, transient imports, clears). */
export function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

/** Monotonic version that increments on every mutation; use it in query keys. */
export function getVersion(): number {
    return version;
}

/**
 * Load the library into memory. Cheap to call repeatedly — the work runs once.
 * If `serverKey` no longer matches the persisted owner the store is wiped first,
 * so logging into a different server never shows a stale library.
 */
export function init(serverKey: string): Promise<void> {
    if (initPromise) return initPromise;

    initPromise = (async () => {
        const storedKey = await getMeta<string>(META_SERVER_KEY);
        if (storedKey && storedKey !== serverKey) {
            await clearAllStores();
        }
        if (storedKey !== serverKey) {
            await putMeta(META_SERVER_KEY, serverKey);
        }

        songs = await getAll<LibrarySong>(STORE_SONGS);
        albums = await getAll<LibraryAlbum>(STORE_ALBUMS);
        reindex();
        notify();
    })();

    return initPromise;
}

export function isReady(): boolean {
    return initPromise !== null;
}

/** Non-transient songs only — the user's actual library. */
export function getLibrarySongs(): LibrarySong[] {
    return songs.filter((s) => !s.transient);
}

export function getSongById(id: string): LibrarySong | undefined {
    return songsById.get(id);
}

export function getLibraryAlbums(): LibraryAlbum[] {
    return albums.filter((a) => !a.transient);
}

export function getAlbumById(id: string): LibraryAlbum | undefined {
    return albumsById.get(id);
}

/** All songs (including transient) that belong to the given album key. */
export function getAlbumSongs(albumKey: string): LibrarySong[] {
    return songs
        .filter((s) => s.albumKey === albumKey || s.albumId === albumKey)
        .sort((a, b) => (a.discNumber || 0) - (b.discNumber || 0) || (a.track || 0) - (b.track || 0));
}

export function getLibrarySongCount(): number {
    return songs.reduce((count, s) => (s.transient ? count : count + 1), 0);
}

export function getLastSyncedAt(): Promise<number | undefined> {
    return getMeta<number>(META_LAST_SYNCED);
}

function matches(haystack: string | undefined, needle: string): boolean {
    return (haystack || "").toLowerCase().includes(needle);
}

interface SongQuery {
    query?: string
    artistId?: string
    offset?: number
    limit?: number
}

/** Filter + paginate the library songs in memory. */
export function searchSongs({ query = "", artistId = "", offset = 0, limit }: SongQuery) {
    const needle = query.trim().toLowerCase();

    let result = getLibrarySongs();

    if (artistId) {
        result = result.filter(
            (s) => s.artistId === artistId || s.artists?.some((a) => a.id === artistId),
        );
    }

    if (needle) {
        result = result.filter(
            (s) => matches(s.title, needle) || matches(s.artist, needle) || matches(s.album, needle),
        );
    }

    const total = result.length;
    const page = limit != null ? result.slice(offset, offset + limit) : result.slice(offset);

    return { songs: page as ISong[], total };
}

interface AlbumQuery {
    filter?: string
    genre?: string
    query?: string
    artistId?: string
    yearSort?: string
    offset?: number
    limit?: number
}

/** Sort/filter/paginate the library albums in memory, honouring the page filters. */
export function queryAlbums({
    filter = AlbumsFilters.RecentlyAdded,
    genre = "",
    query = "",
    artistId = "",
    yearSort = YearSortOptions.Oldest,
    offset = 0,
    limit,
}: AlbumQuery) {
    let result = getLibraryAlbums();

    if (artistId) {
        result = result.filter(
            (a) => a.artistId === artistId || a.artists?.some((entry) => entry.id === artistId),
        );
    }

    if (filter === AlbumsFilters.ByGenre && genre) {
        const g = genre.toLowerCase();
        result = result.filter(
            (a) => matches(a.genre, g) || a.genres?.some((entry) => matches(entry.name, g)),
        );
    } else if (filter === AlbumsFilters.Search && query) {
        const needle = query.trim().toLowerCase();
        result = result.filter((a) => matches(a.name, needle) || matches(a.artist, needle));
    } else if (filter === AlbumsFilters.Starred) {
        result = result.filter((a) => !!a.starred);
    }

    result = sortAlbums(result, filter, yearSort);

    const total = result.length;
    const page = limit != null ? result.slice(offset, offset + limit) : result.slice(offset);

    return { albums: page as Albums[], total };
}

function sortAlbums(list: LibraryAlbum[], filter: string, yearSort: string): LibraryAlbum[] {
    const sorted = [...list];

    switch (filter) {
        case AlbumsFilters.ByName:
        case AlbumsFilters.Search:
            return sorted.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        case AlbumsFilters.ByArtist:
            return sorted.sort(
                (a, b) => (a.artist || "").localeCompare(b.artist || "")
                || (a.name || "").localeCompare(b.name || ""),
            );
        case AlbumsFilters.MostPlayed:
            return sorted.sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
        case AlbumsFilters.RecentlyPlayed:
            return sorted.sort((a, b) => dateValue(b.played) - dateValue(a.played));
        case AlbumsFilters.Starred:
            return sorted.sort((a, b) => dateValue(b.starred) - dateValue(a.starred));
        case AlbumsFilters.ByYear:
            return sorted.sort((a, b) => yearSort === YearSortOptions.Newest
                ? (b.year || 0) - (a.year || 0)
                : (a.year || 0) - (b.year || 0));
        case AlbumsFilters.Random:
            return shuffle(sorted);
        case AlbumsFilters.RecentlyAdded:
        default:
            return sorted.sort((a, b) => dateValue(b.created) - dateValue(a.created));
    }
}

/** Fisher–Yates shuffle for the "Random" album order. */
function shuffle<T>(list: T[]): T[] {
    for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
}

function dateValue(value?: string): number {
    if (!value) return 0;
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
}

/**
 * Commit a full library sync: the synced (non-transient) songs/albums become the
 * library, replacing the previous non-transient set so server-side deletions
 * disappear, while any on-demand transient records that weren't superseded are
 * retained for fast album loads.
 */
export async function commitFullSync(
    syncedSongs: LibrarySong[],
    syncedAlbums: LibraryAlbum[],
): Promise<void> {
    const syncedSongIds = new Set(syncedSongs.map((s) => s.id));
    const retainedSongs = songs.filter((s) => s.transient && !syncedSongIds.has(s.id));
    const nextSongs = [...syncedSongs, ...retainedSongs];

    const syncedAlbumIds = new Set(syncedAlbums.map((a) => a.id));
    const retainedAlbums = albums.filter((a) => a.transient && !syncedAlbumIds.has(a.id));
    const nextAlbums = [...syncedAlbums, ...retainedAlbums];

    await replaceAll(STORE_SONGS, nextSongs);
    await replaceAll(STORE_ALBUMS, nextAlbums);
    await putMeta(META_LAST_SYNCED, Date.now());

    songs = nextSongs;
    albums = nextAlbums;
    reindex();
    notify();
}

/**
 * Persist songs/albums discovered while opening an album that isn't fully in the
 * library. New records are marked transient so they stay hidden from library
 * views but load instantly on the next visit. Records already present (e.g. real
 * library songs) are left untouched.
 */
export async function importTransient(
    importedSongs: LibrarySong[],
    importedAlbum?: LibraryAlbum,
): Promise<void> {
    const newSongs = importedSongs
        .filter((s) => !songsById.has(s.id))
        .map((s) => ({ ...s, transient: true }));

    const newAlbums = importedAlbum && !albumsById.has(importedAlbum.id)
        ? [{ ...importedAlbum, transient: true }]
        : [];

    if (newSongs.length === 0 && newAlbums.length === 0) return;

    await putAll(STORE_SONGS, newSongs);
    await putAll(STORE_ALBUMS, newAlbums);

    songs = [...songs, ...newSongs];
    albums = [...albums, ...newAlbums];
    reindex();
    notify();
}

/** Reset everything in memory and on disk (used on sign-out). */
export async function clear(): Promise<void> {
    await clearAllStores();
    songs = [];
    albums = [];
    reindex();
    initPromise = null;
    notify();
}
