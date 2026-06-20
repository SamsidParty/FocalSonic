// Caching still in broken state, can't figure out how to make it work well

import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient, useQuery, UseQueryOptions } from "@tanstack/react-query";
import { useEffect } from "react";

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
    // Exact same reference/value
    if (oldObj === newObj) {
        return oldObj;
    }

    // Preserve AWS presigned URLs
    if (
        typeof oldObj === "string" &&
        typeof newObj === "string"
    ) {
        const oldIsPresigned =
            oldObj.includes("X-Amz-Credential=");

        const newIsPresigned =
            newObj.includes("X-Amz-Credential=");

        if (oldIsPresigned && newIsPresigned) {
            return oldObj;
        }

        return newObj;
    }

    // Arrays
    if (Array.isArray(oldObj) && Array.isArray(newObj)) {
        if (oldObj.length !== newObj.length) {
            return newObj.map((item, i) =>
                preservePresignedUrls(oldObj[i], item));
        }

        let changed = false;

        const result = new Array(newObj.length);

        for (let i = 0; i < newObj.length; i++) {
            result[i] = preservePresignedUrls(
                oldObj[i],
                newObj[i]
            );

            if (result[i] !== oldObj[i]) {
                changed = true;
            }
        }

        return changed ? result : oldObj;
    }

    // Objects
    if (
        oldObj &&
        newObj &&
        typeof oldObj === "object" &&
        typeof newObj === "object" &&
        !Array.isArray(oldObj) &&
        !Array.isArray(newObj)
    ) {
        const oldKeys = Object.keys(oldObj);
        const newKeys = Object.keys(newObj);

        if (oldKeys.length !== newKeys.length) {
            const result: any = {};

            for (const key of newKeys) {
                result[key] = preservePresignedUrls(
                    oldObj[key],
                    newObj[key]
                );
            }

            return result;
        }

        let changed = false;
        const result: any = {};

        for (const key of newKeys) {
            result[key] = preservePresignedUrls(
                oldObj[key],
                newObj[key]
            );

            if (result[key] !== oldObj[key]) {
                changed = true;
            }
        }

        return changed ? result : oldObj;
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

export function useLibraryQuery<TData>(
    options: UseQueryOptions<TData>
) {
    const query = useQuery(options);

    useEffect(() => {
        if (!query.data) return;

        console.log(query.data);
    }, [query.data]);

    return query;
}