import * as localLibrary from "@/lib/localLibrary";
import { LibraryPlaylist } from "@/lib/localLibrary";
import { service } from "@/service/service";
import { CreateParams, Playlist, PlaylistWithEntries, UpdateParams } from "@/types/responses/playlist";
import { ISong } from "@/types/responses/song";
import { checkServerType } from "@/utils/servers";

/**
 * Two-way playlist sync. Mutations are applied to the local index first (instant
 * UI), then pushed to the server, reverting/reconciling on failure. Track lists
 * load lazily on open, mirroring the album-detail pattern.
 */

let tempCounter = 0;

function toLibraryPlaylist(playlist: Playlist): LibraryPlaylist {
    return { ...playlist, syncedAt: Date.now(), entriesLoaded: false };
}

function normalizeIds(ids?: string | string[]): string[] {
    if (!ids) return [];
    return Array.isArray(ids) ? ids : [ids];
}

/** Pull the playlist list (metadata only) into the local index. */
export async function syncPlaylists(): Promise<void> {
    const list = await service.playlists.getAll();
    const mapped = (list ?? [])
        .filter((playlist) => playlist && !playlist.id.startsWith("folder:"))
        .map(toLibraryPlaylist);

    await localLibrary.commitPlaylistsSync(mapped);
}

/** Replay playlists with unconfirmed local changes by re-pulling from the server. */
export async function flushPendingPlaylists(): Promise<void> {
    if (localLibrary.getPendingPlaylists().length === 0) return;
    await syncPlaylists().catch(() => undefined);
}

/**
 * Cache an already-fetched playlist's ordered track list locally (offline + 2-way
 * sync + favorites seeding). Pure side effect — does not refetch or touch the
 * caller's rendered data.
 */
export async function cachePlaylistEntries(playlist: PlaylistWithEntries): Promise<void> {
    const { entry, ...meta } = playlist;
    const entries = entry ?? [];
    await localLibrary.cachePlaylist(meta, entries);

    // Apple Music's favorite-songs playlist seeds the local song-favorites index.
    if (playlist.isFavorites) {
        await localLibrary.markSongFavoritesLocal(entries.map((song) => song.id));
    }
}

/** Fetch a playlist's full ordered track list and cache it locally. */
export async function loadPlaylistEntries(id: string): Promise<PlaylistWithEntries | null> {
    const playlist = await service.playlists.getOne(id) as PlaylistWithEntries | null;
    if (!playlist) return null;

    await cachePlaylistEntries(playlist);
    return playlist;
}

/** Create a playlist optimistically, then reconcile with the server's real id. */
export async function createPlaylist(params: CreateParams): Promise<void> {
    const songIds = normalizeIds(params.songIdToAdd);
    const tempId = `local:${Date.now()}:${tempCounter++}`;
    const now = new Date().toISOString();

    const optimistic: LibraryPlaylist = {
        id: tempId,
        name: params.name,
        comment: params.comment ?? "",
        public: params.isPublic === "true",
        owner: "",
        songCount: songIds.length,
        duration: 0,
        created: now,
        changed: now,
        coverArt: "",
        entryIds: songIds,
        entriesLoaded: true,
        syncedAt: Date.now(),
        pending: "create",
    };
    await localLibrary.upsertPlaylistLocal(optimistic);

    try {
        await service.playlists.createWithDetails(params);
        // Pull the real playlist in first (temp is retained as pending), then drop
        // the temp so the list never flashes empty.
        await syncPlaylists();
        await localLibrary.removePlaylistLocal(tempId);
    } catch (error) {
        await localLibrary.removePlaylistLocal(tempId);
        throw error;
    }
}

/** Edit playlist metadata (name/comment/visibility) locally then on the server. */
export async function updatePlaylist(params: UpdateParams): Promise<void> {
    const existing = localLibrary.getPlaylistById(params.playlistId);

    if (existing) {
        await localLibrary.upsertPlaylistLocal({
            ...existing,
            name: params.name ?? existing.name,
            comment: params.comment ?? existing.comment,
            public: params.isPublic ? params.isPublic === "true" : existing.public,
            changed: new Date().toISOString(),
            pending: "update",
        });
    }

    try {
        await service.playlists.update(params);
        const current = localLibrary.getPlaylistById(params.playlistId);
        if (current) await localLibrary.upsertPlaylistLocal({ ...current, pending: undefined });
    } catch (error) {
        // Restore the original (clearing pending) so the re-pull can overwrite it.
        if (existing) await localLibrary.upsertPlaylistLocal({ ...existing, pending: undefined });
        await syncPlaylists().catch(() => undefined);
        throw error;
    }
}

/** Delete a playlist locally then on the server, restoring it on failure. */
export async function removePlaylist(id: string): Promise<void> {
    const existing = localLibrary.getPlaylistById(id);
    if (existing) {
        await localLibrary.upsertPlaylistLocal({ ...existing, pending: "remove" });
    }

    try {
        await service.playlists.remove(id);
        await localLibrary.removePlaylistLocal(id);
    } catch (error) {
        if (existing) await localLibrary.upsertPlaylistLocal({ ...existing, pending: undefined });
        throw error;
    }
}

/** Add songs to a playlist locally then on the server. */
export async function addSongsToPlaylist(
    playlistId: string,
    songIds: string | string[],
    songs: ISong[] = [],
): Promise<void> {
    const ids = normalizeIds(songIds);
    if (ids.length === 0) return;

    const resolved = songs.length
        ? songs
        : ids.map((id) => localLibrary.getSongById(id)).filter((s): s is NonNullable<typeof s> => !!s);

    await localLibrary.addPlaylistEntriesLocal(playlistId, ids, resolved);

    try {
        await service.playlists.update({ playlistId, songIdToAdd: ids });
    } catch (error) {
        await loadPlaylistEntries(playlistId).catch(() => undefined);
        throw error;
    }
}

/**
 * Remove songs from a playlist locally then on the server. `selectors` are
 * positional index strings on Subsonic and Apple Music library track ids on Apple
 * (matching how the menus invoke removal).
 */
export async function removeSongsFromPlaylist(playlistId: string, selectors: string[]): Promise<void> {
    if (selectors.length === 0) return;

    const { isAppleMusic } = checkServerType();

    const indexes = isAppleMusic
        ? selectors
            .map((libId) => localLibrary
                .getPlaylistEntries(playlistId)
                .findIndex((song) => song.appleMusic?.libraryID === libId))
            .filter((index) => index >= 0)
        : selectors.map(Number).filter((index) => !Number.isNaN(index));

    await localLibrary.removePlaylistEntriesLocal(playlistId, indexes);

    try {
        if (isAppleMusic) {
            // Apple removes one library track id per request.
            for (const libId of selectors) {
                await service.playlists.update({ playlistId, songIndexToRemove: libId });
            }
        } else {
            await service.playlists.update({ playlistId, songIndexToRemove: selectors });
        }
    } catch (error) {
        await loadPlaylistEntries(playlistId).catch(() => undefined);
        throw error;
    }
}
