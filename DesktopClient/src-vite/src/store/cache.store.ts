import { ICacheContext } from "@/types/cacheContext";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { createWithEqualityFn } from "zustand/traditional";

// Many of the stored keys are URLs which may contain the user's credentials in the query params
// To avoid leaking those, we should hash them.
// This hash function is not cryptographically secure but is good enough to prevent the credentials from being stored
const hash = (str: string, seed = 0) => {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for(let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1  = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2  = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

export const useCacheStore = createWithEqualityFn<ICacheContext>()(
    subscribeWithSelector(
        persist(
            devtools(
                immer((set, get) => ({
                    imageDominantColors: {},
                    saveImageDominantColor: (url, color) => {
                        set((state) => {
                            state.imageDominantColors[hash(url)] = color;
                        });
                    },
                    tryGetImageDominantColor: (url) => {
                        return get().imageDominantColors[hash(url)];
                    },
                })),
                {
                    name: "cache_store",
                },
            ),
            {
                name: "cache_store",
            },
        ),
    ),
);

export const useCache = () => useCacheStore((state) => state);
