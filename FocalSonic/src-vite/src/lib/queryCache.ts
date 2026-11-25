import { version } from "@/../package.json";
import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/utils/queryKeys";
import { dehydrate, hydrate, type DehydratedState, type Query, type QueryKey } from "@tanstack/react-query";

/*
 * Persists the React Query cache in C# (Persistence/QueryCache.cs), so that the main window, whose
 * web view is destroyed when it closes, and the next launch can paint straight from it.
 *
 * - Restored data is only a placeholder: every restored query is marked invalidated, so it refetches
 *   the next time it's used whatever its staleTime, and the UI moves on to live data when that lands.
 * - Nothing waits on the restore for longer than RESTORE_TIMEOUT_MS, and the snapshot is fetched
 *   as soon as this module loads, so it's normally there long before the router asks for it.
 * - The snapshot belongs to one app version and one server/account; anything else is ignored, and
 *   signing in or out clears it.
 * - It travels over plain HTTP rather than through IgniteView's commands or localStorage, which
 *   run on the C# main thread and slow everything down with this much data.
 */

/** Bump when the persisted shape, or what's persisted, changes. (2: playlists' "loaded" flags left out) */
const FORMAT = 2;

/** Queries whose data is older than this aren't restored (nor kept around to be persisted again). */
const MAX_AGE = 24 * 60 * 60 * 1000;

/** Under QueryCache.MaxBytes; the largest queries are left out to fit. */
const MAX_BYTES = 6 * 1024 * 1024;

/** How long the router waits for the snapshot, at most, before going on without it. */
const RESTORE_TIMEOUT_MS = 300;

/** Saves trail the last change by this much, but never wait longer than SAVE_MAX_WAIT_MS. */
const SAVE_DELAY_MS = 1000;
const SAVE_MAX_WAIT_MS = 5000;

/** Not worth keeping: short-lived, cached elsewhere already, or tied to this machine. */
const EXCLUDED_KEYS = new Set<unknown>([
    "get-lyrics",
    "alt-lyric-channel",
    "server-get-scan-status",
    "fonts",
    queryKeys.search,
    queryKeys.update.check,
    queryKeys.update.serverInfo,
]);

interface PersistedQueryCache {
    format: number
    buster: string
    savedAt: number
    state: DehydratedState
}

const enabled = typeof window !== "undefined" && !!window.igniteView;

function endpoint() {
    return `${window.igniteView?.resolverURL ?? "/dynamic"}/query-cache`;
}

function bust(serverKey: string) {
    return `${version}|${serverKey}`;
}

// Fetched right away, in parallel with the rest of the boot.
let pending: Promise<PersistedQueryCache | null> = enabled
    ? fetch(endpoint(), { cache: "no-store" })
        .then((response) => (response.status === 200 ? response.json() : null))
        .catch(() => null)
    : Promise.resolve(null);

let restored: Promise<void> | undefined;
let buster: string | undefined;

/**
 * Puts the persisted queries back in the cache (once), then starts persisting it. Call when the
 * server config is known, before the routes that use the cached queries render.
 * @param serverKey identifies the server and account the queries belong to
 */
export function restoreQueryCache(serverKey: string): Promise<void> {
    restored ??= (async () => {
        buster = bust(serverKey);

        try {
            const persisted = await Promise.race([
                pending,
                new Promise<null>((resolve) => setTimeout(() => resolve(null), RESTORE_TIMEOUT_MS)),
            ]);

            if (persisted) apply(persisted);
        }
        catch (error) {
            console.error("[QueryCache] Couldn't restore the query cache", error);
        }
        finally {
            startPersisting();
        }
    })();

    return restored;
}

/** Forgets the cache, here and in C#. For signing out. */
export async function clearQueryCache() {
    stopPersisting();
    saveController?.abort();
    queryClient.clear();

    // A sign in without a reload restores nothing (every Apple Music account has the same server key).
    pending = Promise.resolve(null);
    restored = undefined;

    if (enabled) {
        await fetch(endpoint(), { method: "DELETE" }).catch(() => undefined);
    }
}

function apply(persisted: PersistedQueryCache) {
    if (persisted.format !== FORMAT || persisted.buster !== buster || !Array.isArray(persisted.state?.queries)) return;

    const cutoff = Date.now() - MAX_AGE;
    const queries = persisted.state.queries.filter((query) => {
        return query.state.status === "success" && query.state.dataUpdatedAt >= cutoff && !isExcluded(query.queryKey);
    });

    hydrate(queryClient, { mutations: [], queries });

    // Placeholders only: each refetches the next time it's used, whatever its staleTime. (hydrate
    // leaves any query that already has newer data alone, and so does this.)
    const restoredAt = new Map(queries.map((query) => [query.queryHash, query.state.dataUpdatedAt]));
    void queryClient.invalidateQueries({
        predicate: (query) => restoredAt.get(query.queryHash) === query.state.dataUpdatedAt,
        refetchType: "none",
    });
}

function isExcluded(queryKey: QueryKey) {
    return EXCLUDED_KEYS.has(queryKey[0]);
}

function shouldPersist(query: Query) {
    const { status, data, dataUpdatedAt } = query.state;

    if (status !== "success" || data === undefined || data === null) return false;
    if (dataUpdatedAt < Date.now() - MAX_AGE) return false;
    // A query can opt out with meta: { persist: false }
    if (isExcluded(query.queryKey) || (query.meta as { persist?: boolean } | undefined)?.persist === false) return false;

    // Infinite lists: they're large and refetch every loaded page.
    const pages = data as { pages?: unknown, pageParams?: unknown };
    if (Array.isArray(pages.pages) && Array.isArray(pages.pageParams)) return false;

    return true;
}

function serialize(): string {
    const state = dehydrate(queryClient, { shouldDehydrateQuery: shouldPersist });
    const persisted = (): PersistedQueryCache => ({ format: FORMAT, buster: buster!, savedAt: Date.now(), state });

    let body = JSON.stringify(persisted());
    if (body.length <= MAX_BYTES) return body;

    // Too big: leave out the largest queries until it fits.
    const sized = state.queries
        .map((query) => ({ query, size: JSON.stringify(query).length }))
        .sort((a, b) => a.size - b.size);

    let total = body.length;
    while (total > MAX_BYTES && sized.length) {
        total -= sized.pop()!.size;
    }

    state.queries = sized.map(({ query }) => query);
    body = JSON.stringify(persisted());
    return body;
}

let unsubscribe: (() => void) | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;
let firstChangeAt: number | undefined;
let saving = false;
let saveAgain = false;
let saveController: AbortController | undefined;

function startPersisting() {
    if (!enabled || unsubscribe) return;

    unsubscribe = queryClient.getQueryCache().subscribe((event) => {
        // Only data changes matter: a query that got new data, or one that went away.
        if (event.type === "removed" || (event.type === "updated" && event.action.type === "success")) {
            scheduleSave();
        }
    });
}

function stopPersisting() {
    unsubscribe?.();
    unsubscribe = undefined;
    clearTimeout(timer);
    timer = undefined;
    firstChangeAt = undefined;
}

function scheduleSave() {
    const now = Date.now();
    firstChangeAt ??= now;

    clearTimeout(timer);
    timer = setTimeout(save, Math.max(0, Math.min(SAVE_DELAY_MS, firstChangeAt + SAVE_MAX_WAIT_MS - now)));
}

async function save() {
    timer = undefined;
    firstChangeAt = undefined;

    if (saving) {
        saveAgain = true;
        return;
    }

    saving = true;
    saveController = new AbortController();

    try {
        await fetch(endpoint(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: serialize(),
            signal: saveController.signal,
        });
    }
    catch (error) {
        if (!saveController.signal.aborted) console.error("[QueryCache] Couldn't save the query cache", error);
    }
    finally {
        saving = false;
        saveController = undefined;

        if (saveAgain && unsubscribe) {
            saveAgain = false;
            scheduleSave();
        }
    }
}
