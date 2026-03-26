import { ItemMenuOptions } from "@/app/components/options/item-menu";
import { Playlist, PlaylistWithEntries } from "@/types/responses/playlist";

export function hasPlaylistMenuOptions(playlist: PlaylistWithEntries | Playlist): boolean {
    return !playlist.id.startsWith("folder:") && !playlist.appleMusic?.type?.includes("playlist-folders");
}

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
    if (!hasPlaylistMenuOptions(playlist)) {
        return null;
    }

    return (
        <ItemMenuOptions
            variant={variant}
            target={{
                type: "playlist",
                item: playlist,
                context: {
                    showPlay,
                    disablePlayNext,
                    disableAddLast,
                    disableDownload,
                    disableEdit,
                    disableDelete,
                },
            }}
        />
    );
}
