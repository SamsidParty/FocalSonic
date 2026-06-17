// Caching still in broken state, can't figure out how to make it work well

import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import type { QueryKey, UndefinedInitialDataOptions } from "@tanstack/react-query";
import { QueryClient } from "@tanstack/react-query";

export const QUERY_CACHE_STALE_TIME = 5 * 60 * 1000;
export const QUERY_CACHE_MAX_AGE = 24 * 60 * 60 * 1000;

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            structuralSharing: (oldData, newData) => {
                if (!oldData) return newData;

                return preserveArtworkUrls(oldData, newData);
            }
        },
    },
});

function preserveArtworkUrls(oldObj: any, newObj: any): any {
    if (!oldObj || !newObj) return newObj;

    if (Array.isArray(newObj)) {
        return newObj.map((item, i) =>
            preserveArtworkUrls(oldObj[i], item));
    }

    if (typeof newObj === "object") {
        const result: any = {};

        for (const key of Object.keys(newObj)) {
            if (
                key === "url" &&
        oldObj?.url &&
        newObj?.url &&
        (newObj.url.includes("X-Amz-Credential"))
            ) {
                result[key] = oldObj.url;
            } else {
                result[key] = preserveArtworkUrls(
                    oldObj[key],
                    newObj[key]
                );
            }
        }

        return result;
    }

    return newObj;
}

export const queryCacheStorage = {
    getItem: async (key: string) => {
        if (window.igniteView?.commandBridge?.getCustomOverride) {
            return await window.igniteView?.commandBridge?.getCustomOverride("TQueryCache", key);
        }

        const data = localStorage.getItem(key);
        return data;
    },
    setItem: async (key: string, value: string) => {
        if (window.igniteView?.commandBridge?.saveCustomOverride) {
            return await window.igniteView?.commandBridge?.saveCustomOverride("TQueryCache", key, value);
        }

        localStorage.setItem(key, value);
    },
    removeItem: async (key: string) => {
        if (window.igniteView?.commandBridge?.saveCustomOverride) {
            return await window.igniteView?.commandBridge?.saveCustomOverride("TQueryCache", key, null);
        }

        localStorage.removeItem(key);
    },
};

const persister = createAsyncStoragePersister({
    storage: sessionStorage,
});

export const persistOptions = {
    persister,
    maxAge: QUERY_CACHE_MAX_AGE,
};

export const makeQueryPersistent = <
    TQueryFnData = unknown,
    TError = Error,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
>(options: UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>) => {
    return {
        ...options,
    };
};
