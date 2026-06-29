import { useLibraryVersion } from "@/app/hooks/use-library-sync";
import * as localLibrary from "@/lib/localLibrary";
import { appleMusic } from "@/service/applemusic";
import { service } from "@/service/service";
import { convertAppleMusicPlaylistToSubsonic } from "@/types/applemusic/playlist";
import { queryKeys } from "@/utils/queryKeys";
import { checkServerType } from "@/utils/servers";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export const useDisplayPlaylists = (folderId?: string) => {
    const { isAppleMusic } = checkServerType();
    const libraryVersion = useLibraryVersion();

    // Subsonic's root list is served from the local index; Apple Music keeps the
    // server folder view since folders aren't represented in the flat local index.
    const useLocal = !isAppleMusic && !folderId;
    const localPlaylists = useMemo(
        () => (useLocal ? localLibrary.getPlaylists() : []),
        [useLocal, libraryVersion],
    );
    const libraryHasPlaylists = localPlaylists.length > 0;

    const query = useQuery({
        queryKey: [queryKeys.playlist.display, folderId],
        queryFn: async () => {
            if (isAppleMusic) {
                const fetchedFolders = await appleMusic.playlists.getPlaylistFolders(folderId);
                return fetchedFolders?.data?.map(convertAppleMusicPlaylistToSubsonic) ?? [];
            }

            return service.playlists.getAll();
        },
        enabled: !libraryHasPlaylists,
    });

    if (libraryHasPlaylists) {
        return { ...query, data: localPlaylists, isLoading: false, isFetched: true } as typeof query;
    }

    return query;
};

export const useGetAppleMusicPlaylistFolders = () => {
    const { isAppleMusic } = checkServerType();

    return useQuery({
        queryKey: [queryKeys.appleMusic.playlistFolders],
        queryFn: () => isAppleMusic ? appleMusic.playlists.getPlaylistFolders() : Promise.resolve({ }),
    });
};
