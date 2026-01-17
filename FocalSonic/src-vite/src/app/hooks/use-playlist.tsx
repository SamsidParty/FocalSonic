import { appleMusic } from "@/service/applemusic";
import { service } from "@/service/service";
import { convertAppleMusicPlaylistToSubsonic } from "@/types/applemusic/playlist";
import { queryKeys } from "@/utils/queryKeys";
import { checkServerType } from "@/utils/servers";
import { useQuery } from "@tanstack/react-query";

export const useDisplayPlaylists = (folderId?: string) => {
    const { isAppleMusic } = checkServerType();

    return useQuery({
        queryKey: [queryKeys.playlist.display, folderId],
        queryFn: async () => {
            if (isAppleMusic) {
                const fetchedFolders = await  appleMusic.playlists.getPlaylistFolders(folderId);
                return fetchedFolders?.data?.map(convertAppleMusicPlaylistToSubsonic) ?? [];
            }

            return service.playlists.getAll();
        },
    });
};

export const useGetAppleMusicPlaylistFolders = () => {
    const { isAppleMusic } = checkServerType();

    return useQuery({
        queryKey: [queryKeys.appleMusic.playlistFolders],
        queryFn: () => isAppleMusic ? appleMusic.playlists.getPlaylistFolders() : Promise.resolve({ }),
    });
};