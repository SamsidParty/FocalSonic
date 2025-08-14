import { service } from "@/service/service";
import { queryKeys } from "@/utils/queryKeys";
import { useQuery } from "@tanstack/react-query";

export const useGetAlbum = (albumId: string) => {
    return useQuery({
        queryKey: [queryKeys.album.single, albumId],
        queryFn: () => service.albums.getOne(albumId),
    });
};

export const useGetAlbumInfo = (albumId: string) => {
    return useQuery({
        queryKey: [queryKeys.album.info, albumId],
        queryFn: () => service.albums.getInfo(albumId),
        enabled: !!albumId,
    });
};

export const useGetArtistAlbums = (artistId: string) => {
    return useQuery({
        queryKey: [queryKeys.album.moreAlbums, artistId],
        queryFn: () => service.artists.getOne(artistId),
        enabled: !!artistId,
    });
};

export const useGetGenreAlbums = (genre: string) => {
    return useQuery({
        queryKey: [queryKeys.album.genreAlbums, genre],
        queryFn: () =>
            service.albums.getAlbumList({
                type: "byGenre",
                genre,
                size: 16,
            }),
        enabled: !!genre,
    });
};
