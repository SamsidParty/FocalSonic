import { Albums } from "@/types/responses/album";
import { ISimilarArtist } from "@/types/responses/artist";
import { Playlist } from "@/types/responses/playlist";
import { ISong } from "@/types/responses/song";
import { AlbumsFilters, YearSortOptions } from "@/utils/albumsFilter";
import {
    clearAllStores,
    deleteValue,
    getAll,
    getMeta,
    putAll,
    putMeta,
    replaceAll,
} from "./db";
import {
    FavoriteRecord,
    FavoriteType,
    favoriteKey,
    LibraryAlbum,
    LibraryPlaylist,
    LibrarySong,
    META_LAST_SYNCED,
    META_SERVER_KEY,
    STORE_ALBUMS,
    STORE_FAVORITES,
    STORE_PLAYLISTS,
    STORE_SONGS,
} from "./types";

/**
 * High-level, in-memory-cached view over the IndexedDB-backed local library.
 *
 * The whole library is small enough to keep resident, so reads are synchronous
 * array operations — instant sorting/searching/grouping without ~500ms server
 * round trips. IndexedDB is the persistence layer; this module is the query +
 * local-mutation layer. Writers update IndexedDB, refresh the in-memory cache, and
 * bump a version number that React Query keys subscribe to. It never imports the
 * `service` layer — sync orchestration that does lives in `lib/sync`.
 */

let songs: LibrarySong[] = [];
let albums: LibraryAlbum[] = [];
let playlists: LibraryPlaylist[] = [];
let favorites = new Map<string, FavoriteRecord>();

let songsById = new Map<string, LibrarySong>();
let albumsById = new Map<string, LibraryAlbum>();
let playlistsById = new Map<string, LibraryPlaylist>();

let version = 0;
let initPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

function reindex() {
    songsById = new Map(songs.map((s) => [s.id, s]));
    albumsById = new Map(albums.map((a) => [a.id, a]));
    playlistsById = new Map(playlists.map((p) => [p.id, p]));
}

function notify() {
    version++;
    listeners.forEach((listener) => listener());
}

/** Subscribe to library mutations (sync completion, imports, local edits, clears). */
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
        playlists = await getAll<LibraryPlaylist>(STORE_PLAYLISTS);
        const favoriteRecords = await getAll<FavoriteRecord>(STORE_FAVORITES);
        favorites = new Map(favoriteRecords.map((f) => [f.key, f]));
        reindex();
        notify();
    })();

    return initPromise;
}

export function isReady(): boolean {
    return initPromise !== null;
}

/** Library songs only (transient album/playlist tracks are excluded). */
export function getLibrarySongs(): LibrarySong[] {
    return songs.filter((s) => s.inLibrary);
}

export function getSongById(id: string): LibrarySong | undefined {
    return songsById.get(id);
}

export function getLibraryAlbums(): LibraryAlbum[] {
    return albums.filter((a) => a.inLibrary);
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
    return songs.reduce((count, s) => (s.inLibrary ? count + 1 : count), 0);
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
        result = result.filter((a) => isFavorite("album", a.id) || !!a.starred);
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
        case AlbumsFilters.RecentlyAdded:
        default:
            return sorted.sort((a, b) => dateValue(b.created) - dateValue(a.created));
    }
}

function dateValue(value?: string): number {
    if (!value) return 0;
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
}

function isPresignedUrl(url?: string): boolean {
    return !!url && url.includes("X-Amz-Credential=");
}

/** Whether a presigned URL is past (or within 60s of) its X-Amz-Date + X-Amz-Expires. */
function isPresignedExpired(url: string): boolean {
    try {
        const params = new URL(url).searchParams;
        const date = params.get("X-Amz-Date"); // YYYYMMDDTHHMMSSZ
        const expires = Number(params.get("X-Amz-Expires"));
        if (!date || !Number.isFinite(expires)) return true;
        const iso = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`
            + `T${date.slice(9, 11)}:${date.slice(11, 13)}:${date.slice(13, 15)}Z`;
        const start = Date.parse(iso);
        if (Number.isNaN(start)) return true;
        return Date.now() > start + expires * 1000 - 60_000;
    } catch {
        return true;
    }
}

/**
 * Pick a cover that's both stable and live. Apple serves a NEW presigned URL every
 * fetch, so re-storing it would change every `<img src>` and reload thumbnails. We
 * keep the already-stored presigned URL (no reload — the local-store equivalent of
 * React Query's `preservePresignedUrls`) UNLESS it's expired, in which case we take
 * the fresh one (a one-off reload is fine to replace a dead URL). Missing covers and
 * non-presigned covers (Subsonic ids, mzstatic templates) always take the incoming.
 */
function resolveStableCover(existing: string | undefined, incoming: string): string {
    if (existing && isPresignedUrl(existing) && !isPresignedExpired(existing)) {
        return existing;
    }
    return incoming || existing || "";
}

/**
 * Library artists derived from the indexed library songs (grouped by artist id,
 * falling back to a name key). Album count is the number of distinct albums the
 * artist appears on. Real artist ids resolve to artist artwork as the server list
 * did; derived/name keys fall back to a representative cover.
 */
export function getDerivedArtists(): ISimilarArtist[] {
    interface Acc { id: string; name: string; albumKeys: Set<string>; cover: string }
    const byKey = new Map<string, Acc>();

    for (const song of getLibrarySongs()) {
        const name = song.artist || "Unknown";
        // Apple's artistId (`authorof_songs:<songId>`) points at the song, not the
        // artist, so group Apple by name; Subsonic groups by its real artist id.
        const applePointer = song.artistId?.startsWith("authorof_");
        const key = (!song.artistId || applePointer) ? `name:${name}` : song.artistId;

        let entry = byKey.get(key);
        if (!entry) {
            entry = { id: song.artistId || key, name, albumKeys: new Set(), cover: song.coverArt || "" };
            byKey.set(key, entry);
        }
        if (song.albumKey) entry.albumKeys.add(song.albumKey);
        if (!entry.cover && song.coverArt) entry.cover = song.coverArt;
    }

    const derived: ISimilarArtist[] = [];
    for (const entry of Array.from(byKey.values())) {
        // A real (Subsonic) id resolves to artist artwork; pointers/name keys use a cover.
        const realId = !entry.id.startsWith("authorof_") && !entry.id.startsWith("name:");
        derived.push({
            id: entry.id,
            name: entry.name,
            albumCount: entry.albumKeys.size,
            coverArt: realId ? entry.id : entry.cover,
            artistImageUrl: "",
            starred: getFavoriteDate("artist", entry.id),
        });
    }

    return derived.sort((a, b) => a.name.localeCompare(b.name));
}

/** Playlists, most recently changed first; locally-removed ones are hidden. */
export function getPlaylists(): LibraryPlaylist[] {
    return playlists
        .filter((p) => p.pending !== "remove")
        .sort((a, b) => dateValue(b.changed) - dateValue(a.changed) || (a.name || "").localeCompare(b.name || ""));
}

export function getPlaylistById(id: string): LibraryPlaylist | undefined {
    return playlistsById.get(id);
}

/** Ordered entries for a playlist, resolved from the songs store. */
export function getPlaylistEntries(id: string): ISong[] {
    const playlist = playlistsById.get(id);
    if (!playlist?.entryIds) return [];

    const result: ISong[] = [];
    for (const entryId of playlist.entryIds) {
        const song = songsById.get(entryId);
        if (song) result.push(song);
    }
    return result;
}

export function isFavorite(type: FavoriteType, id: string): boolean {
    return !!favorites.get(favoriteKey(type, id))?.starred;
}

export function getFavoriteDate(type: FavoriteType, id: string): string | undefined {
    return favorites.get(favoriteKey(type, id))?.starred;
}

export function getPendingFavorites(): FavoriteRecord[] {
    return Array.from(favorites.values()).filter((f) => f.pending);
}

export function getPendingPlaylists(): LibraryPlaylist[] {
    return playlists.filter((p) => p.pending);
}

/**
 * Commit a full library sync: synced songs/albums become the library (`inLibrary`),
 * replacing the previous library set so server-side deletions disappear, while any
 * transient records (album/playlist tracks) that weren't superseded are retained.
 */
export async function commitFullSync(
    syncedSongs: LibrarySong[],
    syncedAlbums: LibraryAlbum[],
): Promise<void> {
    const syncedSongIds = new Set(syncedSongs.map((s) => s.id));
    const retainedSongs = songs.filter((s) => !s.inLibrary && !syncedSongIds.has(s.id));
    const nextSongs = [
        ...syncedSongs.map((s) => ({ ...s, coverArt: resolveStableCover(songsById.get(s.id)?.coverArt, s.coverArt) })),
        ...retainedSongs,
    ];

    const syncedAlbumIds = new Set(syncedAlbums.map((a) => a.id));
    const retainedAlbums = albums.filter((a) => !a.inLibrary && !syncedAlbumIds.has(a.id));
    const nextAlbums = [
        ...syncedAlbums.map((a) => ({ ...a, coverArt: resolveStableCover(albumsById.get(a.id)?.coverArt, a.coverArt) })),
        ...retainedAlbums,
    ];

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
 * library. New records stay transient (no `inLibrary`) so they're hidden from
 * library views but load instantly next time. Records already present are untouched.
 */
export async function importTransient(
    importedSongs: LibrarySong[],
    importedAlbum?: LibraryAlbum,
): Promise<void> {
    const newSongs = importedSongs.filter((s) => !songsById.has(s.id));

    const newAlbums = importedAlbum && !albumsById.has(importedAlbum.id)
        ? [importedAlbum]
        : [];

    if (newSongs.length === 0 && newAlbums.length === 0) return;

    await putAll(STORE_SONGS, newSongs);
    await putAll(STORE_ALBUMS, newAlbums);

    songs = [...songs, ...newSongs];
    albums = [...albums, ...newAlbums];
    reindex();
    notify();
}

/** Replace the synced (non-pending) playlist set, keeping local pending changes. */
export async function commitPlaylistsSync(synced: LibraryPlaylist[]): Promise<void> {
    const pendingById = new Map(playlists.filter((p) => p.pending).map((p) => [p.id, p]));
    const next: LibraryPlaylist[] = [];

    for (const playlist of synced) {
        if (pendingById.has(playlist.id)) continue;
        const existing = playlistsById.get(playlist.id);
        const merged = { ...playlist, coverArt: resolveStableCover(existing?.coverArt, playlist.coverArt) };
        next.push(existing?.entriesLoaded
            ? { ...merged, entryIds: existing.entryIds, entriesLoaded: true }
            : merged);
    }
    for (const pending of Array.from(pendingById.values())) {
        if (pending.pending !== "remove") next.push(pending);
    }

    await replaceAll(STORE_PLAYLISTS, next);
    playlists = next;
    reindex();
    notify();
}

export async function upsertPlaylistLocal(playlist: LibraryPlaylist): Promise<void> {
    await putAll(STORE_PLAYLISTS, [playlist]);
    playlists = [...playlists.filter((p) => p.id !== playlist.id), playlist];
    reindex();
    notify();
}

export async function removePlaylistLocal(id: string): Promise<void> {
    await deleteValue(STORE_PLAYLISTS, id);
    playlists = playlists.filter((p) => p.id !== id);
    reindex();
    notify();
}

/**
 * Cache a fetched playlist: writes its metadata back (so the local record gets the
 * real cover + track count from `getOne`, not the bare list-endpoint version) and
 * stores its ordered tracks as transient songs. Covers are resolved stably (kept
 * while a valid presigned URL, refreshed when expired/missing), so re-opening an
 * unchanged playlist is a no-op (no reload), while expired covers do refresh.
 */
export async function cachePlaylist(meta: Playlist, entries: ISong[]): Promise<void> {
    const id = meta.id;
    const existing = playlistsById.get(id);
    const syncedAt = Date.now();
    const entryIds = entries.map((s) => s.id);

    const songsToWrite: LibrarySong[] = [];
    for (const song of entries) {
        const existingSong = songsById.get(song.id);
        const coverArt = resolveStableCover(existingSong?.coverArt, song.coverArt);
        if (!existingSong) {
            songsToWrite.push({ ...song, coverArt, albumKey: song.albumId || `pl:${id}`, syncedAt });
        } else if (existingSong.coverArt !== coverArt) {
            songsToWrite.push({ ...existingSong, coverArt });
        }
    }

    const coverArt = resolveStableCover(existing?.coverArt, meta.coverArt);
    const updated: LibraryPlaylist = {
        ...existing,
        ...meta,
        coverArt,
        entryIds,
        entriesLoaded: true,
        songCount: entries.length,
        duration: entries.reduce((sum, s) => sum + (s.duration || 0), 0) || meta.duration || existing?.duration || 0,
        syncedAt,
        pending: existing?.pending,
    };

    // Re-opening an unchanged playlist: skip the write + notify (no reload).
    const sameEntries = existing?.entriesLoaded
        && existing.entryIds?.length === entryIds.length
        && existing.entryIds.every((value, i) => value === entryIds[i]);
    const sameMeta = existing
        && existing.coverArt === coverArt
        && existing.name === updated.name
        && existing.songCount === updated.songCount;
    if (songsToWrite.length === 0 && sameEntries && sameMeta) return;

    await putAll(STORE_SONGS, songsToWrite);
    await putAll(STORE_PLAYLISTS, [updated]);

    if (songsToWrite.length) {
        const writeById = new Map(songsToWrite.map((s) => [s.id, s]));
        const added = songsToWrite.filter((s) => !songsById.has(s.id));
        songs = [...songs.map((s) => writeById.get(s.id) ?? s), ...added];
    }
    playlists = [...playlists.filter((p) => p.id !== id), updated];
    reindex();
    notify();
}

/**
 * Optimistically append songs to a playlist. `songIds` drives ordering/count;
 * any full records in `songRecords` are imported as transient songs for display.
 */
export async function addPlaylistEntriesLocal(
    id: string,
    songIds: string[],
    songRecords: ISong[] = [],
): Promise<void> {
    const playlist = playlistsById.get(id);
    if (!playlist || songIds.length === 0) return;

    const syncedAt = Date.now();
    const newSongs: LibrarySong[] = [];
    for (const song of songRecords) {
        if (!songsById.has(song.id)) {
            newSongs.push({ ...song, albumKey: song.albumId || `pl:${id}`, syncedAt });
        }
    }

    const updated: LibraryPlaylist = playlist.entriesLoaded
        ? {
            ...playlist,
            entryIds: [...(playlist.entryIds ?? []), ...songIds],
            songCount: (playlist.entryIds?.length ?? 0) + songIds.length,
        }
        : { ...playlist, songCount: playlist.songCount + songIds.length };

    await putAll(STORE_SONGS, newSongs);
    await putAll(STORE_PLAYLISTS, [updated]);

    if (newSongs.length) songs = [...songs, ...newSongs];
    playlists = playlists.map((p) => (p.id === id ? updated : p));
    reindex();
    notify();
}

/** Optimistically remove entries (by position) from a loaded playlist. */
export async function removePlaylistEntriesLocal(id: string, indexes: number[]): Promise<void> {
    const playlist = playlistsById.get(id);
    if (!playlist?.entryIds) return;

    const remove = new Set(indexes);
    const entryIds = playlist.entryIds.filter((_, i) => !remove.has(i));
    const updated: LibraryPlaylist = { ...playlist, entryIds, songCount: entryIds.length };

    await putAll(STORE_PLAYLISTS, [updated]);
    playlists = playlists.map((p) => (p.id === id ? updated : p));
    reindex();
    notify();
}

function mirrorStarredToRecord(type: FavoriteType, id: string, starred?: string) {
    if (type === "song") {
        const song = songsById.get(id);
        if (song) { song.starred = starred; return { store: STORE_SONGS, record: song }; }
    } else if (type === "album") {
        const album = albumsById.get(id);
        if (album) { album.starred = starred; return { store: STORE_ALBUMS, record: album }; }
    }
    return null;
}

/** Replace the synced (non-pending) favorites set, keeping local pending changes. */
export async function commitFavoritesSync(synced: FavoriteRecord[]): Promise<void> {
    const next = new Map<string, FavoriteRecord>();
    for (const record of synced) next.set(record.key, { ...record, pending: false });
    for (const record of Array.from(favorites.values())) {
        if (record.pending) next.set(record.key, record);
    }

    favorites = next;
    await replaceAll(STORE_FAVORITES, Array.from(next.values()));
    notify();
}

/** Batch-mark songs as favorited (e.g. Apple Music's dynamic favorite-songs playlist). */
export async function markSongFavoritesLocal(ids: string[]): Promise<void> {
    const syncedAt = Date.now();
    const now = new Date().toISOString();
    const added: FavoriteRecord[] = [];

    for (const id of ids) {
        const key = favoriteKey("song", id);
        if (favorites.get(key)?.starred) continue;
        const record: FavoriteRecord = { key, id, type: "song", starred: now, pending: false, syncedAt };
        favorites.set(key, record);
        added.push(record);
    }

    if (added.length === 0) return;
    await putAll(STORE_FAVORITES, added);
    notify();
}

/** Set/clear a local favorite, mirroring the date onto the matching song/album record. */
export async function setFavoriteLocal(
    type: FavoriteType,
    id: string,
    starred: boolean,
    pending = true,
): Promise<void> {
    const key = favoriteKey(type, id);
    const record: FavoriteRecord = {
        key,
        id,
        type,
        starred: starred ? new Date().toISOString() : undefined,
        pending,
        syncedAt: Date.now(),
    };

    favorites.set(key, record);
    await putAll(STORE_FAVORITES, [record]);

    const mirrored = mirrorStarredToRecord(type, id, record.starred);
    if (mirrored) await putAll(mirrored.store, [mirrored.record]);

    notify();
}

/** Mark a favorite as confirmed by the server; drops the record if it was unfavorited. */
export async function clearFavoritePending(type: FavoriteType, id: string): Promise<void> {
    const key = favoriteKey(type, id);
    const record = favorites.get(key);
    if (!record) return;

    if (!record.starred) {
        favorites.delete(key);
        await deleteValue(STORE_FAVORITES, key);
    } else {
        const updated = { ...record, pending: false };
        favorites.set(key, updated);
        await putAll(STORE_FAVORITES, [updated]);
    }
}

/** Reset everything in memory and on disk (used on sign-out). */
export async function clear(): Promise<void> {
    await clearAllStores();
    songs = [];
    albums = [];
    playlists = [];
    favorites = new Map();
    reindex();
    initPromise = null;
    notify();
}
