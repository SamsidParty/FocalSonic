import { service } from "@/service/service";
import { queryKeys } from "@/utils/queryKeys";
import { useQuery } from "@tanstack/react-query";

export const useGetArtist = (artistId: string) => {
    return useQuery({
        queryKey: [queryKeys.artist.single, artistId],
        queryFn: () => service.artists.getOne(artistId),
        enabled: !!artistId,
    });
};

export const useGetArtistInfo = (artistId: string) => {
    return useQuery({
        queryKey: [queryKeys.artist.info, artistId],
        queryFn: () => service.artists.getInfo(artistId),
        enabled: !!artistId,
    });
};

export const useGetTopSongs = (artistName?: string) => {
    return useQuery({
        queryKey: [queryKeys.artist.topSongs, artistName],
        queryFn: () => service.songs.getTopSongs(artistName ?? ""),
        enabled: !!artistName,
    });
};
