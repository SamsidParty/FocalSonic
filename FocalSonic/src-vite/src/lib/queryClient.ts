import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient, UndefinedInitialDataOptions } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            notifyOnChangeProps: ["data", "error"] 
        },
    },
});

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
    storage: queryCacheStorage,
});

persistQueryClient({
    queryClient,
    persister,
});

export const makeQueryPersistent = (options: UndefinedInitialDataOptions<any, Error, any, string[]>) => {

    // TANSTACK IS DAMN GARBAGE RETARDED CODE
    // I'll figure this out later icba

    return {
        ...options
    } as UndefinedInitialDataOptions<any, Error, any, string[]>;
};