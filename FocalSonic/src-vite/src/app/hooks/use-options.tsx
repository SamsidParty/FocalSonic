import { getDownloadUrl } from "@/api/httpClient";
import { service } from "@/service/service";
import { usePlayerActions } from "@/store/player.store";
import { usePlaylistRemoveSong } from "@/store/playlists.store";
import { useItemInfo } from "@/store/ui.store";
import { UpdateParams } from "@/types/responses/playlist";
import { ISong } from "@/types/responses/song";
import { IInfoItemTarget } from "@/types/uiContext";
import { queryKeys } from "@/utils/queryKeys";
import { isTauri } from "@/utils/tauriTools";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { t } from "i18next";
import { useMatches } from "react-router-dom";
import { toast } from "react-toastify";
import { useDownload } from "./use-download";

type SongIdToAdd = Pick<UpdateParams, "songIdToAdd">["songIdToAdd"]

export function useOptions() {
    const { setNextOnQueue, setLastOnQueue, setSongList } = usePlayerActions();
    const { downloadBrowser, downloadTauri } = useDownload();
    const { setActionData, setConfirmDialogState } = usePlaylistRemoveSong();
    const matches = useMatches();
    const { openInfo } = useItemInfo();

    const isOnPlaylistPage = matches.find((route) => route.id === "playlist");
    const playlistId = isOnPlaylistPage?.params.playlistId ?? "";

    const queryClient = useQueryClient();

    function play(list: ISong[]) {
        setSongList(list, 0);
    }

    function playNext(list: ISong[]) {
        setNextOnQueue(list);
    }

    function playLast(list: ISong[]) {
        setLastOnQueue(list);
    }

    function startDownload(id: string) {
        const url = getDownloadUrl(id);
        if (isTauri()) {
            downloadTauri(url, id);
        } else {
            downloadBrowser(url);
        }
    }

    const updateMutation = useMutation({
        mutationFn: service.playlists.update,
        onSuccess: async (_data, variables) => {
            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: [queryKeys.playlist.all],
                }),
                queryClient.invalidateQueries({
                    queryKey: [queryKeys.playlist.display],
                }),
                queryClient.invalidateQueries({
                    queryKey: [queryKeys.playlist.single],
                }),
                queryClient.invalidateQueries({
                    queryKey: [queryKeys.playlist.single, variables.playlistId],
                }),
            ]);

            if (isOnPlaylistPage && playlistId) {
                await queryClient.invalidateQueries({
                    queryKey: [queryKeys.playlist.single, playlistId],
                });
            }
        },
        onError: () => {
            toast.error(t("playlist.form.edit.toast.error"));
        },
    });

    async function addToPlaylist(id: string, songIdToAdd: SongIdToAdd) {
        await updateMutation.mutateAsync({
            playlistId: id,
            songIdToAdd,
        });
    }

    const createMutation = useMutation({
        mutationFn: service.playlists.createWithDetails,
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: [queryKeys.playlist.all],
                }),
                queryClient.invalidateQueries({
                    queryKey: [queryKeys.playlist.display],
                }),
                queryClient.invalidateQueries({
                    queryKey: [queryKeys.playlist.single],
                }),
            ]);
        },
    });

    async function createNewPlaylist(name: string, songIdToAdd: SongIdToAdd) {
        await createMutation.mutateAsync({
            name,
            comment: "",
            isPublic: "false",
            songIdToAdd,
        });
    }

    function removeSongFromPlaylist(songIndexes: string[]) {
        setActionData({
            playlistId,
            songIndexes,
        });
        setConfirmDialogState(true);
    }

    function openItemInfo(target: IInfoItemTarget) {
        openInfo(target);
    }

    function openSongInfo(id: string) {
        openItemInfo({ type: "song", id });
    }

    return {
        play,
        playNext,
        playLast,
        startDownload,
        addToPlaylist,
        createNewPlaylist,
        removeSongFromPlaylist,
        openItemInfo,
        openSongInfo,
        isOnPlaylistPage,
        playlistId,
    };
}
