import { QueryClient, UndefinedInitialDataOptions } from "@tanstack/react-query";

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
        const data = localStorage.getItem(key);
        return data;
    },
    setItem: async (key: string, value: string) => {
        localStorage.setItem(key, value);
    },
    removeItem: async (key: string) => {
        localStorage.removeItem(key);
    },
};

export const makeQueryPersistent = (options: UndefinedInitialDataOptions<any, Error, any, string[]>) => {

    // TANSTACK IS DAMN GARBAGE RETARDED CODE
    // I'll figure this out later icba

    return {
        ...options
    } as UndefinedInitialDataOptions<any, Error, any, string[]>;
};