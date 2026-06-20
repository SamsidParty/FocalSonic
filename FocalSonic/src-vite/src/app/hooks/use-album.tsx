import * as localLibrary from "@/lib/localLibrary";
import { LibraryAlbum, LibrarySong } from "@/lib/localLibrary";
import { service } from "@/service/service";
import { SingleAlbum } from "@/types/responses/album";
import { queryKeys } from "@/utils/queryKeys";
import { useQuery } from "@tanstack/react-query";
import omit from "lodash/omit";

/** Assemble a playable album from the local library, synchronously, if we have it. */
function buildAlbumFromLibrary(albumId: string): SingleAlbum | undefined {
    const album = localLibrary.getAlbumById(albumId);
    const songs = localLibrary.getAlbumSongs(albumId);

    if (!album && songs.length === 0) return undefined;

    if (album) {
        return { ...album, song: songs } as unknown as SingleAlbum;
    }

    const first = songs[0];
    return {
        id: albumId,
        name: first.album,
        artist: first.artist,
        artistId: first.artistId,
        coverArt: first.coverArt,
        songCount: songs.length,
        duration: songs.reduce((sum, s) => sum + (s.duration || 0), 0),
        year: first.year,
        genre: first.genre,
        song: songs,
    } as unknown as SingleAlbum;
}

/**
 * Persist an album's full track list fetched from the API. Tracks not already in
 * the library are stored as transient so the album loads instantly next time
 * without bloating the library views. Cheap libraries can't afford to fetch every
 * album up front, so this fills the gaps lazily as the user browses.
 */
async function cacheAlbumFromApi(albumId: string, apiAlbum: SingleAlbum) {
    const syncedAt = Date.now();

    const importedSongs: LibrarySong[] = (apiAlbum.song ?? []).map((song) => ({
        ...song,
        albumKey: albumId,
        syncedAt,
    }));

    const albumRecord = {
        ...omit(apiAlbum, "song"),
        id: albumId,
        albumKey: albumId,
        syncedAt,
    } as LibraryAlbum;

    await localLibrary.importTransient(importedSongs, albumRecord);
}

export const useGetAlbum = (albumId: string) => {
    return useQuery({
        // The library version is deliberately NOT in the key: the queryFn imports
        // transient tracks (which bumps the version), so keying on it would refetch
        // in a loop. The API result supersedes the placeholder regardless.
        queryKey: [queryKeys.album.single, albumId],
        // Show whatever the library already has immediately, then refine with the
        // API which carries the album's complete, ordered track list.
        placeholderData: () => buildAlbumFromLibrary(albumId),
        queryFn: async () => {
            const apiAlbum = await service.albums.getOne(albumId);

            if (apiAlbum) {
                await cacheAlbumFromApi(albumId, apiAlbum);
                return apiAlbum;
            }

            return buildAlbumFromLibrary(albumId) ?? null;
        },
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
