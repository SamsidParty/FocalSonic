import { PlaylistOptions } from "@/app/components/playlist/options";
import { SongMenuOptions } from "@/app/components/song/menu-options";
import { SelectedSongsMenuOptions } from "@/app/components/song/selected-options";
import { Playlist } from "@/types/responses/playlist";
import { ISong } from "@/types/responses/song";
import { Row, Table } from "@tanstack/react-table";
import { ReactNode } from "react";

export type DataTableType = "song" | "artist" | "playlist" | "radio" | "album";
export type DataTablePageType = "general" | "queue" | "queue-small";

interface DataTableContextMenuOptionsArgs<TData> {
    dataType: DataTableType
    pageType?: DataTablePageType
    row: Row<TData>
    showContextMenu: boolean
    table: Table<TData>
}

export function getDataTableContextMenuOptions<TData>({
    dataType,
    pageType = "general",
    row,
    showContextMenu,
    table,
}: DataTableContextMenuOptionsArgs<TData>): ReactNode {
    if (!showContextMenu) {
        return undefined;
    }

    if (dataType === "song") {
        if (table.getIsSomeRowsSelected() || table.getIsAllRowsSelected()) {
            return <SelectedSongsMenuOptions table={table as unknown as Table<ISong>} />;
        }

        return (
            <SongMenuOptions
                variant="context"
                index={row.index}
                song={row.original as ISong}
                context={pageType === "queue" || pageType === "queue-small"
                    ? { source: "queue" }
                    : undefined}
            />
        );
    }

    if (dataType === "playlist") {
        return (
            <PlaylistOptions
                variant="context"
                playlist={row.original as Playlist}
                showPlay={true}
            />
        );
    }

    return undefined;
}