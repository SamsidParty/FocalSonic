import * as localLibrary from "@/lib/localLibrary";
import { FavoriteRecord, FavoriteType, favoriteKey } from "@/lib/localLibrary";
import { service } from "@/service/service";
import { LibrarySyncSource } from "@/service/librarySyncTypes";
import { checkServerType } from "@/utils/servers";
import { t } from "i18next";
import { toast } from "react-toastify";

/**
 * Two-way favorites sync. Local state is updated first (instant UI), then the
 * change is pushed to the server; a hard failure reverts. Pending changes are
 * replayed on the next full sync (`flushPendingFavorites`).
 */

/** Toggle a favorite locally then push to the server, reverting on failure. */
export async function toggleFavorite(
    type: FavoriteType,
    id: string,
    currentlyStarred: boolean,
): Promise<void> {
    await localLibrary.setFavoriteLocal(type, id, !currentlyStarred, true);

    try {
        await service.star.handleStarItem({ id, starred: currentlyStarred, type });
        await localLibrary.clearFavoritePending(type, id);
    } catch (error) {
        await localLibrary.setFavoriteLocal(type, id, currentlyStarred, false);
        toast.error(t("album.buttons.error", { defaultValue: "Couldn't update favorite" }));
        throw error;
    }
}

/** Push any favorites not yet confirmed by the server; keep them pending on failure. */
export async function flushPendingFavorites(): Promise<void> {
    for (const fav of localLibrary.getPendingFavorites()) {
        try {
            await service.star.handleStarItem({ id: fav.id, starred: !fav.starred, type: fav.type });
            await localLibrary.clearFavoritePending(fav.type, fav.id);
        } catch {
            // Leave pending so the next sync retries.
        }
    }
}

/**
 * Pull the server's favorites into the local index. Library items already carry
 * their starred state; Subsonic adds a full pass (artists + non-library items).
 * Apple album/artist favorites stay server-driven, so only songs are indexed there.
 */
export async function syncFavorites(): Promise<void> {
    const { isAppleMusic } = checkServerType();
    const syncedAt = Date.now();
    const records = new Map<string, FavoriteRecord>();

    const add = (type: FavoriteType, id: string, starred?: string) => {
        if (!id) return;
        const key = favoriteKey(type, id);
        if (!records.has(key)) records.set(key, { key, id, type, starred, syncedAt });
    };

    for (const song of localLibrary.getLibrarySongs()) {
        if (song.starred) add("song", song.id, song.starred);
    }
    if (!isAppleMusic) {
        for (const album of localLibrary.getLibraryAlbums()) {
            if (album.starred) add("album", album.id, album.starred);
        }
    }

    const source = service.librarySync as LibrarySyncSource;
    if (source.fetchFavorites) {
        const page = await source.fetchFavorites();
        page.songs.forEach((item) => add("song", item.id, item.starred));
        page.albums.forEach((item) => add("album", item.id, item.starred));
        page.artists.forEach((item) => add("artist", item.id, item.starred));
    }

    await localLibrary.commitFavoritesSync(Array.from(records.values()));
}
