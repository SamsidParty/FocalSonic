import { useSongList } from "@/app/hooks/use-song-list";
import { OptionsButtons } from "@/app/components/options/buttons";
import { AddToPlaylistSubMenu } from "@/app/components/song/add-to-playlist";
import usePlayArtistRadio from "@/app/hooks/use-play-artist-radio";
import { useOptions } from "@/app/hooks/use-options";
import { service } from "@/service/service";
import { usePlayerActions } from "@/store/player.store";
import { usePlaylists, useRemovePlaylist } from "@/store/playlists.store";
import { IArtist } from "@/types/responses/artist";
import { SingleAlbum } from "@/types/responses/album";
import { Playlist, PlaylistWithEntries } from "@/types/responses/playlist";
import { ISong } from "@/types/responses/song";
import { checkServerType } from "@/utils/servers";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { MenuSeparatorFactory } from "./separator-factory";

export type ItemMenuVariant = "dropdown" | "context"

export type ItemMenuContext = {
    source?: "general" | "queue"
    showPlay?: boolean
    disablePlayNext?: boolean
    disableAddLast?: boolean
    disableDownload?: boolean
    disableEdit?: boolean
    disableDelete?: boolean
}

type ItemMenuTarget =
    | {
        type: "song"
        item: ISong
        index: number
        context?: ItemMenuContext
    }
    | {
        type: "album"
        item: SingleAlbum
        context?: ItemMenuContext
    }
    | {
        type: "artist"
        item: IArtist
        context?: ItemMenuContext
    }
    | {
        type: "playlist"
        item: PlaylistWithEntries | Playlist
        context?: ItemMenuContext
    }

interface ItemMenuOptionsProps {
    variant: ItemMenuVariant
    target: ItemMenuTarget
}

export function ItemMenuOptions({ variant, target }: ItemMenuOptionsProps) {
    switch (target.type) {
        case "song":
            return <SongItemMenu variant={variant} song={target.item} index={target.index} context={target.context} />;
        case "album":
            return <AlbumItemMenu variant={variant} album={target.item} context={target.context} />;
        case "artist":
            return <ArtistItemMenu variant={variant} artist={target.item} context={target.context} />;
        case "playlist":
            return <PlaylistItemMenu variant={variant} playlist={target.item} context={target.context} />;
        default:
            return null;
    }
}

function SongItemMenu({
    variant,
    song,
    index,
    context,
}: {
    variant: ItemMenuVariant
    song: ISong
    index: number
    context?: ItemMenuContext
}) {
    const {
        play,
        playNext,
        playLast,
        createNewPlaylist,
        addToPlaylist,
        removeSongFromPlaylist,
        startDownload,
        openItemInfo,
        isOnPlaylistPage,
    } = useOptions();
    const { removeSongFromQueue } = usePlayerActions();
    const { isAppleMusic } = checkServerType();
    const canDownload = !isAppleMusic && !context?.disableDownload;
    const isQueueContext = context?.source === "queue";
    const canRemoveFromPlaylist =
        isOnPlaylistPage &&
        (!!song?.appleMusic?.parent?.canEdit || !isAppleMusic);

    return (
        <>
            {isQueueContext && (
                <OptionsButtons.Play
                    variant={variant}
                    onClick={(e) => {
                        e.stopPropagation();
                        play([song]);
                    }}
                />
            )}
            {!isQueueContext && (
                <>
                    <OptionsButtons.PlayNext
                        variant={variant}
                        disabled={context?.disablePlayNext}
                        onClick={(e) => {
                            e.stopPropagation();
                            playNext([song]);
                        }}
                    />
                    <OptionsButtons.PlayLast
                        variant={variant}
                        disabled={context?.disableAddLast}
                        onClick={(e) => {
                            e.stopPropagation();
                            playLast([song]);
                        }}
                    />
                </>
            )}
            {isQueueContext && (
                <OptionsButtons.RemoveFromQueue
                    variant={variant}
                    onClick={(e) => {
                        e.stopPropagation();
                        removeSongFromQueue(song.id);
                    }}
                />
            )}

            <MenuSeparatorFactory variant={variant} />
            <OptionsButtons.AddToPlaylistOption variant={variant}>
                <AddToPlaylistSubMenu
                    type={variant}
                    newPlaylistFn={() => createNewPlaylist(song.title, song.id)}
                    addToPlaylistFn={(id) => addToPlaylist(id, song.id)}
                />
            </OptionsButtons.AddToPlaylistOption>
            {canRemoveFromPlaylist && (
                <OptionsButtons.RemoveFromPlaylist
                    variant={variant}
                    onClick={(e) => {
                        e.stopPropagation();
                        removeSongFromPlaylist(
                            isAppleMusic
                                ? [song.appleMusic?.libraryID]
                                : [index.toString()],
                        );
                    }}
                />
            )}
            {canDownload && (
                <>
                    <MenuSeparatorFactory variant={variant} />
                    <OptionsButtons.Download
                        variant={variant}
                        onClick={(e) => {
                            e.stopPropagation();
                            startDownload(song.id);
                        }}
                    />
                </>
            )}
            <MenuSeparatorFactory variant={variant} />
            <OptionsButtons.SongInfo
                variant={variant}
                onClick={(e) => {
                    e.stopPropagation();
                    openItemInfo({ type: "song", id: song.id });
                }}
            />
        </>
    );
}

function AlbumItemMenu({
    variant,
    album,
}: {
    variant: ItemMenuVariant
    album: SingleAlbum
    context?: ItemMenuContext
}) {
    const {
        play,
        playNext,
        playLast,
        startDownload,
        addToPlaylist,
        createNewPlaylist,
        openItemInfo,
    } = useOptions();
    const { isAppleMusic } = checkServerType();

    const songIds = album.song.map((song) => song.id);

    return (
        <>
            <OptionsButtons.Play
                variant={variant}
                onClick={(e) => {
                    e.stopPropagation();
                    play(album.song);
                }}
            />
            <OptionsButtons.PlayNext
                variant={variant}
                onClick={(e) => {
                    e.stopPropagation();
                    playNext(album.song);
                }}
            />
            <OptionsButtons.PlayLast
                variant={variant}
                onClick={(e) => {
                    e.stopPropagation();
                    playLast(album.song);
                }}
            />
            <MenuSeparatorFactory variant={variant} />
            <OptionsButtons.AddToPlaylistOption variant={variant}>
                <AddToPlaylistSubMenu
                    type={variant}
                    newPlaylistFn={() => createNewPlaylist(album.name, songIds)}
                    addToPlaylistFn={(id) => addToPlaylist(id, songIds)}
                />
            </OptionsButtons.AddToPlaylistOption>
            {!isAppleMusic && (
                <>
                    <MenuSeparatorFactory variant={variant} />
                    <OptionsButtons.Download
                        variant={variant}
                        onClick={(e) => {
                            e.stopPropagation();
                            startDownload(album.id);
                        }}
                    />
                </>
            )}
            <MenuSeparatorFactory variant={variant} />
            <OptionsButtons.SongInfo
                variant={variant}
                onClick={(e) => {
                    e.stopPropagation();
                    openItemInfo({ type: "album", id: album.id });
                }}
            />
        </>
    );
}

function ArtistItemMenu({
    variant,
    artist,
}: {
    variant: ItemMenuVariant
    artist: IArtist
    context?: ItemMenuContext
}) {
    const { getArtistAllSongs } = useSongList();
    const { playNext, playLast, startDownload, openItemInfo } = useOptions();
    const { playArtistRadio } = usePlayArtistRadio();
    const { isAppleMusic } = checkServerType();

    async function queueArtistSongs(action: (songs: ISong[]) => void) {
        const songs = await getArtistAllSongs(isAppleMusic ? artist.id : artist.name);
        if (!songs) return;

        action(songs);
    }

    return (
        <>
            <OptionsButtons.Play
                variant={variant}
                onClick={(e) => {
                    e.stopPropagation();
                    playArtistRadio(artist);
                }}
            />
            <OptionsButtons.PlayNext
                variant={variant}
                onClick={async (e) => {
                    e.stopPropagation();
                    await queueArtistSongs(playNext);
                }}
            />
            <OptionsButtons.PlayLast
                variant={variant}
                onClick={async (e) => {
                    e.stopPropagation();
                    await queueArtistSongs(playLast);
                }}
            />
            {!isAppleMusic && (
                <>
                    <MenuSeparatorFactory variant={variant} />
                    <OptionsButtons.Download
                        variant={variant}
                        onClick={(e) => {
                            e.stopPropagation();
                            startDownload(artist.id);
                        }}
                    />
                </>
            )}
            <MenuSeparatorFactory variant={variant} />
            <OptionsButtons.SongInfo
                variant={variant}
                onClick={(e) => {
                    e.stopPropagation();
                    openItemInfo({ type: "artist", id: artist.id });
                }}
            />
        </>
    );
}

function PlaylistItemMenu({
    variant,
    playlist,
    context,
}: {
    variant: ItemMenuVariant
    playlist: PlaylistWithEntries | Playlist
    context?: ItemMenuContext
}) {
    const { t } = useTranslation();
    const { setPlaylistDialogState, setData } = usePlaylists();
    const { setPlaylistId, setConfirmDialogState } = useRemovePlaylist();
    const { play, playNext, playLast, startDownload, openItemInfo } = useOptions();
    const { isAppleMusic } = checkServerType();

    async function getSongsToQueue(callback: (songs: ISong[]) => void) {
        const playlistWithEntries = await service.playlists.getOne(playlist.id);
        if (!playlistWithEntries) return;

        callback(playlistWithEntries.entry);
    }

    function handleEdit() {
        setData({
            id: playlist.id,
            name: playlist.name,
            comment: playlist.comment,
            public: playlist.public,
        });
        setPlaylistDialogState(true);
    }

    const canEditPlaylist = isAppleMusic ? playlist.appleMusic?.data.canEdit : true;

    const content: ReactNode[] = [];

    if (variant === "context") {
        content.push(
            <div key="label" className="px-2 py-0.5 max-w-64">
                <span className="text-xs text-muted-foreground break-words line-clamp-4">
                    {playlist.name}
                </span>
            </div>,
            <MenuSeparatorFactory key="label-separator" variant={variant} />,
        );
    }

    if (context?.showPlay) {
        content.push(
            <OptionsButtons.Play
                key="play"
                variant={variant}
                onClick={(e) => {
                    e.stopPropagation();
                    if (playlist.entry?.length > 0) {
                        play(playlist.entry);
                        return;
                    }

                    void getSongsToQueue(play);
                }}
            />,
        );
    }

    content.push(
        <OptionsButtons.PlayNext
            key="play-next"
            variant={variant}
            disabled={context?.disablePlayNext}
            onClick={(e) => {
                e.stopPropagation();
                if (playlist.entry?.length > 0) {
                    playNext(playlist.entry);
                    return;
                }

                void getSongsToQueue(playNext);
            }}
        />,
        <OptionsButtons.PlayLast
            key="play-last"
            variant={variant}
            disabled={context?.disableAddLast}
            onClick={(e) => {
                e.stopPropagation();
                if (playlist.entry?.length > 0) {
                    playLast(playlist.entry);
                    return;
                }

                void getSongsToQueue(playLast);
            }}
        />,
    );

    if (!isAppleMusic && !context?.disableDownload) {
        content.push(
            <MenuSeparatorFactory key="download-separator" variant={variant} />,
            <OptionsButtons.Download
                key="download"
                variant={variant}
                onClick={(e) => {
                    e.stopPropagation();
                    startDownload(playlist.id);
                }}
            />,
        );
    }

    content.push(<MenuSeparatorFactory key="manage-separator" variant={variant} />);

    if (canEditPlaylist) {
        content.push(
            <OptionsButtons.EditPlaylist
                key="edit"
                variant={variant}
                disabled={context?.disableEdit}
                onClick={(e) => {
                    e.stopPropagation();
                    handleEdit();
                }}
            />,
            <OptionsButtons.RemovePlaylist
                key="delete"
                variant={variant}
                disabled={context?.disableDelete}
                onClick={(e) => {
                    e.stopPropagation();
                    setPlaylistId(playlist.id);
                    setConfirmDialogState(true);
                }}
            />,
        );
    } else {
        content.push(
            <div key="readonly" className="px-2 py-1.5 text-sm text-muted-foreground">
                {t("playlist.readonly", { defaultValue: "Read-only playlist" })}
            </div>,
        );
    }

    content.push(
        <MenuSeparatorFactory key="info-separator" variant={variant} />,
        <OptionsButtons.SongInfo
            key="info"
            variant={variant}
            onClick={(e) => {
                e.stopPropagation();
                openItemInfo({ type: "playlist", id: playlist.id });
            }}
        />,
    );

    return <>{content}</>;
}