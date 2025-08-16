import { OptionsButtons } from "@/app/components/options/buttons";
import { ContextMenuSeparator } from "@/app/components/ui/context-menu";
import { useOptions } from "@/app/hooks/use-options";
import { ISong } from "@/types/responses/song";
import { checkServerType } from "@/utils/servers";
import { AddToPlaylistSubMenu } from "./add-to-playlist";

interface SongMenuOptionsProps {
    variant: "context" | "dropdown"
    song: ISong
    index: number
}

export function SongMenuOptions({
    variant,
    song,
    index,
}: SongMenuOptionsProps) {
    const {
        playNext,
        playLast,
        createNewPlaylist,
        addToPlaylist,
        removeSongFromPlaylist,
        startDownload,
        openSongInfo,
        isOnPlaylistPage,
    } = useOptions();
    const songIndexes = [index.toString()];
    const { isAppleMusic } = checkServerType();

    return (
        <>
            <OptionsButtons.PlayNext
                variant={variant}
                onClick={(e) => {
                    e.stopPropagation();
                    playNext([song]);
                }}
            />
            <OptionsButtons.PlayLast
                variant={variant}
                onClick={(e) => {
                    e.stopPropagation();
                    playLast([song]);
                }}
            />
            <ContextMenuSeparator />
            <OptionsButtons.AddToPlaylistOption variant={variant}>
                <AddToPlaylistSubMenu
                    type={variant}
                    newPlaylistFn={() => createNewPlaylist(song.title, song.id)}
                    addToPlaylistFn={(id) => addToPlaylist(id, song.id)}
                />
            </OptionsButtons.AddToPlaylistOption>
            {isOnPlaylistPage && (isAppleMusic ? (!parseInt(song?.appleMusic?.libraryID)) : true) && (
                <OptionsButtons.RemoveFromPlaylist
                    variant={variant}
                    onClick={(e) => {
                        e.stopPropagation();
                        removeSongFromPlaylist(isAppleMusic ? [song.appleMusic?.libraryID] : songIndexes);
                    }}
                />
            )}
            <ContextMenuSeparator />
            <OptionsButtons.Download
                variant={variant}
                onClick={(e) => {
                    e.stopPropagation();
                    startDownload(song.id);
                }}
            />
            <ContextMenuSeparator />
            <OptionsButtons.SongInfo
                variant={variant}
                onClick={(e) => {
                    e.stopPropagation();
                    openSongInfo(song.id);
                }}
            />
        </>
    );
}
