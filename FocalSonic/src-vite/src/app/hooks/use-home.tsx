import { appleMusic } from "@/service/applemusic";
import { service } from "@/service/service";
import { convertMinutesToMs } from "@/utils/convertSecondsToTime";
import { queryKeys } from "@/utils/queryKeys";
import { useQuery } from "@tanstack/react-query";

export const useGetRandomSongs = () => {
    return useQuery({
        queryKey: [queryKeys.song.random],
        queryFn: () => service.songs.getRandomSongs({ size: 10 }),
    });
};

export const useGetAppleMusicHome = () => {
    return useQuery({
        queryKey: [queryKeys.appleMusic.recommendations],
        queryFn: () => appleMusic.recommendations.getHome(),
    });
}

export const useGetRecentlyAdded = () => {
    return useQuery({
        queryKey: [queryKeys.album.recentlyAdded],
        queryFn: () =>
            service.albums.getAlbumList({
                size: 16,
                type: "newest",
            }),
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
    });
};
