import { QUERY_CACHE_MAX_AGE } from "@/lib/queryClient";
import { appleMusic } from "@/service/applemusic";
import { service } from "@/service/service";
import { convertMinutesToMs } from "@/utils/convertSecondsToTime";
import { queryKeys } from "@/utils/queryKeys";
import { checkServerType } from "@/utils/servers";
import { useQuery } from "@tanstack/react-query";

// The home page is what every launch opens on, so its queries stay in memory (and so in the persisted
// cache, see lib/queryCache.ts) for as long as that's restored, not just while the page is open.
const keepForNextLaunch = { gcTime: QUERY_CACHE_MAX_AGE };

// Random picks aren't worth restoring: yesterday's, swapped for new ones a moment later.
const dontPersist = { meta: { persist: false } };

export const useGetRandomSongs = () => {
    return useQuery({
        queryKey: [queryKeys.song.random],
        queryFn: () => service.songs.getRandomSongs({ size: 10 }),
        ...dontPersist,
    });
};

export const useGetAppleMusicHome = () => {
    return useQuery({
        queryKey: [queryKeys.appleMusic.recommendations],
        queryFn: () => appleMusic.recommendations.getHome(),
        ...keepForNextLaunch,
    });
};

export const useGetAppleMusicPins = () => {
    const { isAppleMusic } = checkServerType();

    return useQuery({
        queryKey: [queryKeys.appleMusic.pins],
        queryFn: () => isAppleMusic ? appleMusic.recommendations.getPins() : Promise.resolve({ data: [], count: 0 }),
        ...keepForNextLaunch,
    });
};


export const useGetRecentlyAdded = () => {
    return useQuery({
        queryKey: [queryKeys.album.recentlyAdded],
        queryFn: () =>
            service.albums.getAlbumList({
                size: 16,
                type: "newest",
            }),
        ...keepForNextLaunch,
    });
};

export const useGetMostPlayed = () => {
    return useQuery({
        queryKey: [queryKeys.album.mostPlayed],
        queryFn: () =>
            service.albums.getAlbumList({
                size: 16,
                type: "frequent",
            }),
        ...keepForNextLaunch,
    });
};

export const useGetRecentlyPlayed = () => {
    return useQuery({
        queryKey: [queryKeys.album.recentlyPlayed],
        queryFn: () =>
            service.albums.getAlbumList({
                size: 16,
                type: "recent",
            }),
        refetchInterval: convertMinutesToMs(2),
        ...keepForNextLaunch,
    });
};

export const useGetRandomAlbums = () => {
    return useQuery({
        queryKey: [queryKeys.album.random],
        queryFn: () =>
            service.albums.getAlbumList({
                size: 16,
                type: "random",
            }),
        ...dontPersist,
    });
};
