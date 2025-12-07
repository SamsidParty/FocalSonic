import { QueryClient, UndefinedInitialDataOptions } from "@tanstack/react-query";

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
        },
    },
});


export const queryCacheStorage = {
    getItem: async (key: string) => {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    },
    setItem: async (key: string, value: unknown) => {
        localStorage.setItem(key, JSON.stringify(value));
    },
    removeItem: async (key: string) => {
        localStorage.removeItem(key);
    },
};

export const makeQueryPersistent = (options: UndefinedInitialDataOptions<any, Error, any, string[]>) => {
    return {
        ...options,
        staleTime: 0,                
        gcTime: Infinity,          
        placeholderData: (previousData, previousQuery) => previousData,
    } as UndefinedInitialDataOptions<any, Error, any, string[]>;
};