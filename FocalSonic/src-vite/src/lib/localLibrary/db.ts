import {
    LIBRARY_DB_NAME,
    LIBRARY_DB_VERSION,
    STORE_ALBUMS,
    STORE_FAVORITES,
    STORE_META,
    STORE_PLAYLISTS,
    STORE_SONGS,
} from "./types";

/**
 * Tiny promise-based IndexedDB wrapper for the local library.
 *
 * Intentionally dependency-free and schema-explicit: the stores hold plain,
 * serializable records keyed by `id` (songs/albums) or `key` (meta). This keeps
 * the on-disk shape transparent so a future C#-side offline index can read and
 * write the same data over the command bridge without reverse-engineering an
 * ORM's internal layout.
 */

let dbPromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(LIBRARY_DB_NAME, LIBRARY_DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;

            if (!db.objectStoreNames.contains(STORE_SONGS)) {
                db.createObjectStore(STORE_SONGS, { keyPath: "id" });
            }
            if (!db.objectStoreNames.contains(STORE_ALBUMS)) {
                db.createObjectStore(STORE_ALBUMS, { keyPath: "id" });
            }
            if (!db.objectStoreNames.contains(STORE_PLAYLISTS)) {
                db.createObjectStore(STORE_PLAYLISTS, { keyPath: "id" });
            }
            if (!db.objectStoreNames.contains(STORE_FAVORITES)) {
                db.createObjectStore(STORE_FAVORITES, { keyPath: "key" });
            }
            if (!db.objectStoreNames.contains(STORE_META)) {
                db.createObjectStore(STORE_META, { keyPath: "key" });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export function getDb(): Promise<IDBDatabase> {
    if (!dbPromise) {
        dbPromise = openDatabase().catch((error) => {
            dbPromise = null; // Allow a later retry if the first open failed
            throw error;
        });
    }

    return dbPromise;
}

function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function txComplete(tx: IDBTransaction): Promise<void> {
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
    });
}

export async function getAll<T>(storeName: string): Promise<T[]> {
    const db = await getDb();
    const tx = db.transaction(storeName, "readonly");
    return promisifyRequest<T[]>(tx.objectStore(storeName).getAll());
}

export async function getValue<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    const db = await getDb();
    const tx = db.transaction(storeName, "readonly");
    return promisifyRequest<T | undefined>(tx.objectStore(storeName).get(key));
}

/** Replace the entire contents of a store with `records` in a single transaction. */
export async function replaceAll<T>(storeName: string, records: T[]): Promise<void> {
    const db = await getDb();
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);

    store.clear();
    for (const record of records) {
        store.put(record);
    }

    return txComplete(tx);
}

/** Remove a single record by key. */
export async function deleteValue(storeName: string, key: IDBValidKey): Promise<void> {
    const db = await getDb();
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).delete(key);
    return txComplete(tx);
}

/** Upsert records into a store without touching the rest of its contents. */
export async function putAll<T>(storeName: string, records: T[]): Promise<void> {
    if (records.length === 0) return;

    const db = await getDb();
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);

    for (const record of records) {
        store.put(record);
    }

    return txComplete(tx);
}

export async function putMeta(key: string, value: unknown): Promise<void> {
    const db = await getDb();
    const tx = db.transaction(STORE_META, "readwrite");
    tx.objectStore(STORE_META).put({ key, value });
    return txComplete(tx);
}

export async function getMeta<T>(key: string): Promise<T | undefined> {
    const record = await getValue<{ key: string; value: T }>(STORE_META, key);
    return record?.value;
}

/** Wipe every library store (used when switching server identities). */
export async function clearAllStores(): Promise<void> {
    const db = await getDb();
    const stores = [STORE_SONGS, STORE_ALBUMS, STORE_PLAYLISTS, STORE_FAVORITES, STORE_META];
    const tx = db.transaction(stores, "readwrite");
    stores.forEach((store) => tx.objectStore(store).clear());
    return txComplete(tx);
}
