import { OptionsButtons } from "@/app/components/options/buttons";
import { DropdownMenuSeparator } from "@/app/components/ui/dropdown-menu";
import { useOptions } from "@/app/hooks/use-options";
import { service } from "@/service/service";
import { usePlaylists, useRemovePlaylist } from "@/store/playlists.store";
import { Playlist, PlaylistWithEntries } from "@/types/responses/playlist";
import { ISong } from "@/types/responses/song";
import { checkServerType } from "@/utils/servers";

interface PlaylistOptionsProps {
    playlist: PlaylistWithEntries | Playlist
    variant?: "context" | "dropdown"
    showPlay?: boolean
    disablePlayNext?: boolean
    disableAddLast?: boolean
    disableDownload?: boolean
    disableEdit?: boolean
    disableDelete?: boolean
}

export function PlaylistOptions({
    playlist,
    variant = "dropdown",
    showPlay = false,
    disablePlayNext = false,
    disableAddLast = false,
    disableDownload = false,
    disableEdit = false,
    disableDelete = false,
}: PlaylistOptionsProps) {
    const { setPlaylistDialogState, setData } = usePlaylists();
    const { play, playNext, playLast, startDownload } = useOptions();
    const { setPlaylistId, setConfirmDialogState } = useRemovePlaylist();
    const { isAppleMusic } = checkServerType();
    const canDownload = !isAppleMusic;

    function handleEdit() {
        setData({
            id: playlist.id,
            name: playlist.name,
            comment: playlist.comment,
            public: playlist.public,
        });
        setPlaylistDialogState(true);
    }

    async function getSongsToQueue(callback: (songs: ISong[]) => void) {
        const playlistWithEntries = await service.playlists.getOne(playlist.id);
        if (!playlistWithEntries) return;

        callback(playlistWithEntries.entry);
    }

    async function handlePlay() {
        if (playlist.entry?.length > 0) {
            play(playlist.entry);
        } else {
            await getSongsToQueue(play);
        }
    }

    async function handlePlayNext() {
        if (playlist.entry?.length > 0) {
            playNext(playlist.entry);
        } else {
            await getSongsToQueue(playNext);
        }
    }

    async function handlePlayLast() {
        if (playlist.entry?.length > 0) {
            playLast(playlist.entry);
        } else {
            await getSongsToQueue(playLast);
        }
    }

    function handleDownload() {
        startDownload(playlist.id);
    }

    return (
        <>
            {variant === "context" && (
                <>
                    <div className="px-2 py-0.5 max-w-64">
                        <span className="text-xs text-muted-foreground break-words line-clamp-4">
                            {playlist.name}
                        </span>
                    </div>
                    <DropdownMenuSeparator />
                </>
            )}
            {showPlay && (
                <OptionsButtons.Play
                    variant={variant}
                    onClick={(e) => {
                        e.stopPropagation();
                        handlePlay();
                    }}
                />
            )}
            <OptionsButtons.PlayNext
                variant={variant}
                disabled={disablePlayNext}
                onClick={(e) => {
                    e.stopPropagation();
                    handlePlayNext();
                }}
            />
            <OptionsButtons.PlayLast
                variant={variant}
                disabled={disableAddLast}
                onClick={(e) => {
                    e.stopPropagation();
                    handlePlayLast();
                }}
            />

            {
                canDownload && (
                    <>
                        <DropdownMenuSeparator />
                        <OptionsButtons.Download
                            variant={variant}
                            disabled={disableDownload}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDownload();
                            }}
                        />
                    </>
                )
            }
            <DropdownMenuSeparator />
            {
                (isAppleMusic ? (playlist.appleMusic?.data.canEdit) : true) && (
                    <>
                        <OptionsButtons.EditPlaylist
                            variant={variant}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleEdit();
                            }}
                            disabled={disableEdit}
                        />
                        <OptionsButtons.RemovePlaylist
                            variant={variant}
                            onClick={(e) => {
                                e.stopPropagation();
                                setPlaylistId(playlist.id);
                                setConfirmDialogState(true);
                            }}
                            disabled={disableDelete}
                        />
                    </>
                )
            }

        </>
    );
}
