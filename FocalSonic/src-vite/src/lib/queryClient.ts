// The cache is persisted outside the web view by lib/queryCache.ts

import { isPresignedExpired, isPresignedUrl } from "@/utils/presignedUrl";
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

    // Preserve AWS presigned URLs: the same object (path) with a new signature keeps the old URL, so its
    // <img> doesn't reload. Not when it's another object (the list changed order) or the old one expired
    // (cached data restored from an earlier session).
    if (
        typeof oldObj === "string" &&
        typeof newObj === "string"
    ) {
        if (
            isPresignedUrl(oldObj) &&
            isPresignedUrl(newObj) &&
            oldObj.split("?")[0] === newObj.split("?")[0] &&
            !isPresignedExpired(oldObj)
        ) {
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
        const newKeys = Object.keys(newObj);

        // A key holding undefined counts as absent: data restored from the persisted cache went
        // through JSON, which drops them, and is otherwise the same as freshly fetched data.
        const definedKeyCount = (obj: any) => Object.keys(obj).filter((key) => obj[key] !== undefined).length;
        let changed = definedKeyCount(oldObj) !== definedKeyCount(newObj);
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