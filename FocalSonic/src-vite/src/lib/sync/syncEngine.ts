import * as localLibrary from "@/lib/localLibrary";
import { LibraryAlbum, LibrarySong } from "@/lib/localLibrary";
import { service } from "@/service/service";
import { LibrarySyncSource } from "@/service/librarySyncTypes";
import { Albums } from "@/types/responses/album";
import { useSyncStore } from "@/store/sync.store";

// Apple's servers are slow (~500ms/round trip), so ranges are fetched in
// parallel. Five concurrent requests keeps things fast without hammering the API.
const MAX_CONCURRENCY = 5;

let inFlight: Promise<void> | null = null;

/** Run async tasks with a bounded number in flight at once. */
async function mapPool<T, R>(
    items: T[],
    limit: number,
    worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
    const results: R[] = new Array(items.length);
    let cursor = 0;

    async function run() {
        while (cursor < items.length) {
            const index = cursor++;
            results[index] = await worker(items[index], index);
        }
    }

    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
    return results;
}

interface CollectedSongs {
    songs: LibrarySong[]
    albumsByKey: Map<string, Albums>
}

/** Total is known up front: build every page range and fetch them in parallel. */
async function fetchSongsByTotal(source: LibrarySyncSource, total: number): Promise<CollectedSongs> {
    const { addSynced } = useSyncStore.getState().actions;
    const pageSize = source.songPageSize;

    const offsets: number[] = [];
    for (let offset = 0; offset < total; offset += pageSize) {
        offsets.push(offset);
    }

    const collected: CollectedSongs = { songs: [], albumsByKey: new Map() };

    await mapPool(offsets, MAX_CONCURRENCY, async (offset) => {
        const page = await source.fetchSongsPage(offset, pageSize);
        accumulateSongs(collected, page.songs, page.albums);
        addSynced(page.songs.length);
    });

    return collected;
}

/**
 * Total is unknown (some Subsonic servers don't report it): fetch in waves of
 * `MAX_CONCURRENCY` pages and stop once a page comes back short.
 */
async function fetchSongsUntilEmpty(source: LibrarySyncSource): Promise<CollectedSongs> {
    const { addSynced, setTotal } = useSyncStore.getState().actions;
    const pageSize = source.songPageSize;

    const collected: CollectedSongs = { songs: [], albumsByKey: new Map() };
    let base = 0;
    let done = false;

    while (!done) {
        const offsets = Array.from({ length: MAX_CONCURRENCY }, (_, i) => base + i * pageSize);
        const pages = await Promise.all(offsets.map((offset) => source.fetchSongsPage(offset, pageSize)));

        for (const page of pages) {
            accumulateSongs(collected, page.songs, page.albums);
            addSynced(page.songs.length);
        }

        // Any page shorter than a full page means we've reached the end.
        if (pages.some((page) => page.songs.length < pageSize)) {
            done = true;
        }

        base += MAX_CONCURRENCY * pageSize;
    }

    setTotal(collected.songs.length);
    return collected;
}

function accumulateSongs(collected: CollectedSongs, songs: LibrarySong[] | unknown[], albums: Albums[]) {
    collected.songs.push(...(songs as LibrarySong[]));
    for (const album of albums) {
        if (album?.id && !collected.albumsByKey.has(album.id)) {
            collected.albumsByKey.set(album.id, album);
        }
    }
}

/** Subsonic exposes a dedicated album endpoint; page through it the same way. */
async function fetchAllAlbums(source: LibrarySyncSource): Promise<Albums[]> {
    if (!source.fetchAlbumsPage) return [];

    const pageSize = source.albumPageSize ?? source.songPageSize;
    const probe = await source.fetchAlbumsPage(0, pageSize);

    const albums: Albums[] = [...probe.albums];

    if (probe.total != null && probe.total > 0) {
        const offsets: number[] = [];
        for (let offset = pageSize; offset < probe.total; offset += pageSize) {
            offsets.push(offset);
        }
        const pages = await mapPool(offsets, MAX_CONCURRENCY, (offset) =>
            source.fetchAlbumsPage!(offset, pageSize));
        pages.forEach((page) => albums.push(...page.albums));
    } else {
        let base = pageSize;
        while (probe.albums.length === pageSize) {
            const page = await source.fetchAlbumsPage(base, pageSize);
            albums.push(...page.albums);
            if (page.albums.length < pageSize) break;
            base += pageSize;
        }
    }

    return albums;
}

/**
 * Fill in album aggregates (track count, duration, cover, year) from the songs
 * that belong to each album. Used for Apple Music, whose albums are derived from
 * the song request and therefore start without these totals.
 */
function enrichAlbumsFromSongs(albums: Albums[], songs: LibrarySong[]): Albums[] {
    const byKey = new Map<string, LibrarySong[]>();
    for (const song of songs) {
        const list = byKey.get(song.albumKey);
        if (list) list.push(song);
        else byKey.set(song.albumKey, [song]);
    }

    return albums.map((album) => {
        const members = byKey.get(album.id);
        if (!members || members.length === 0) return album;

        return {
            ...album,
            songCount: album.songCount || members.length,
            duration: album.duration || members.reduce((sum, s) => sum + (s.duration || 0), 0),
            coverArt: album.coverArt || members[0].coverArt,
            year: album.year || members[0].year,
            genre: album.genre || members.find((s) => s.genre)?.genre || "",
        };
    });
}

async function run(): Promise<void> {
    const { start, setTotal, finish, fail } = useSyncStore.getState().actions;
    start();

    try {
        const source = service.librarySync as LibrarySyncSource;

        // Probe a single song first — Apple reports the library total in `meta`.
        const probe = await source.fetchSongsPage(0, 1);
        if (probe.total != null && probe.total > 0) setTotal(probe.total);

        const collected = probe.total != null && probe.total > 0
            ? await fetchSongsByTotal(source, probe.total)
            : await fetchSongsUntilEmpty(source);

        const albumSources = source.hasAlbumPass
            ? await fetchAllAlbums(source)
            : Array.from(collected.albumsByKey.values());

        const albums = source.hasAlbumPass
            ? albumSources
            : enrichAlbumsFromSongs(albumSources, collected.songs);

        const syncedAt = Date.now();

        const librarySongs: LibrarySong[] = collected.songs.map((song) => ({
            ...song,
            transient: false,
            syncedAt,
        }));

        const libraryAlbums: LibraryAlbum[] = albums.map((album) => ({
            ...album,
            albumKey: album.id,
            transient: false,
            syncedAt,
        }));

        await localLibrary.commitFullSync(librarySongs, libraryAlbums);
        finish(syncedAt);
    } catch (error) {
        console.error("Library sync failed", error);
        fail(error instanceof Error ? error.message : String(error));
        throw error;
    }
}

/**
 * Run a full library sync. Concurrent calls share the same in-flight run so the
 * bootstrap and a manual "Refresh library" can't stomp on each other.
 */
export function syncLibrary(): Promise<void> {
    if (inFlight) return inFlight;

    inFlight = run().finally(() => {
        inFlight = null;
    });

    return inFlight;
}

export function isSyncing(): boolean {
    return inFlight !== null;
}
