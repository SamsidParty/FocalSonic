import { ItemMenuOptions } from "@/app/components/options/item-menu";
import { Playlist, PlaylistWithEntries } from "@/types/responses/playlist";

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
