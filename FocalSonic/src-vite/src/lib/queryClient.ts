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

                // Apple's APIs return presigned S3 URLs that change on every fetch which causes annoying rerender flickering
                // This function prevents that
                return preservePresignedUrls(oldData, newData);
            }
        },
    },
});

// Merges together any S3 presigned URL ("X-Amz-Credential" marker) to stop it from rerendering
function preservePresignedUrls(oldObj: any, newObj: any): any {
    if (
        typeof oldObj === "string" &&
        typeof newObj === "string"
    ) {
        const oldIsPresigned = oldObj.includes("X-Amz-Credential=");
        const newIsPresigned = newObj.includes("X-Amz-Credential=");

        if (oldIsPresigned && newIsPresigned) {
            return oldObj;
        }

        return newObj;
    }

    if (Array.isArray(newObj)) {
        return newObj.map((item, index) =>
            preservePresignedUrls(oldObj?.[index], item));
    }

    if (
        oldObj &&
        newObj &&
        typeof oldObj === "object" &&
        typeof newObj === "object"
    ) {
        const result: any = {};

        for (const key of Object.keys(newObj)) {
            result[key] = preservePresignedUrls(
                oldObj[key],
                newObj[key]
            );
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
