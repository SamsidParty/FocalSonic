import * as localLibrary from "@/lib/localLibrary";
import { syncLibrary } from "@/lib/sync/syncEngine";
import { useAppData, useAppStore } from "@/store/app.store";
import { useEffect, useSyncExternalStore } from "react";

// Re-sync on boot if the last successful sync is older than this.
const STALE_AFTER_MS = 6 * 60 * 60 * 1000;

/** Identifies the library's owning server so a different login can't reuse it. */
function getServerKey(): string {
    const { serverType, url, username } = useAppStore.getState().data;
    return `${serverType}:${url}:${username}`;
}

/**
 * Subscribe to local-library mutations. The returned version number changes on
 * every sync/import/clear, so passing it through React Query keys makes the
 * songs/albums views refresh as soon as new data lands.
 */
export function useLibraryVersion(): number {
    return useSyncExternalStore(localLibrary.subscribe, localLibrary.getVersion, localLibrary.getVersion);
}

/** Trigger a manual full resync (used by the "Refresh library" menu item). */
export function refreshLibrary(): Promise<void> {
    return syncLibrary().catch(() => undefined);
}

/**
 * Mount once near the app root. Opens the local library for the current server
 * and kicks off a background sync when the cached copy is missing or stale.
 */
export function useLibrarySyncBootstrap(): void {
    const { isServerConfigured, serverType, url, username } = useAppData();

    useEffect(() => {
        if (!isServerConfigured) return;

        let cancelled = false;

        (async () => {
            await localLibrary.init(getServerKey());
            if (cancelled) return;

            const lastSyncedAt = await localLibrary.getLastSyncedAt();
            const isStale = !lastSyncedAt || Date.now() - lastSyncedAt > STALE_AFTER_MS;

            if (isStale || localLibrary.getLibrarySongCount() === 0) {
                refreshLibrary();
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [isServerConfigured, serverType, url, username]);
}
