import { Link } from "react-router-dom";

import { ArtistLink } from "@/app/components/song/artist-link";
import { CoverImage } from "@/app/components/table/cover-image";
import PlaySongButton from "@/app/components/table/play-button";
import { DataTableColumnHeader } from "@/app/components/ui/data-table-column-header";
import i18n from "@/i18n";
import { ROUTES } from "@/routes/routesList";
import { ColumnDefType } from "@/types/react-table/columnDef";
import { Albums } from "@/types/responses/album";

export function albumsColumns(): ColumnDefType<Albums>[] {
    return [
        {
            id: "index",
            accessorKey: "index",
            style: {
                width: 48,
                minWidth: "48px",
            },
            header: () => {
                return <div className="w-full text-center">#</div>;
            },
            cell: ({ row, table }) => {
                const index = row.index + 1;
                const album = row.original;

                return (
                    <PlaySongButton
                        trackNumber={index}
                        trackId={album.id}
                        handlePlayButton={() => table.options.meta?.handlePlaySong?.(row)}
                    />
                );
            },
        },
        {
            id: "title",
            accessorKey: "name",
            style: {
                flex: 1,
                minWidth: 250,
            },
            enableSorting: true,
            sortingFn: "customSortFn",
            header: ({ column, table }) => (
                <DataTableColumnHeader column={column} table={table}>
                    {i18n.t("table.columns.title")}
                </DataTableColumnHeader>
            ),
            cell: ({ row }) => {
                const album = row.original;

                return (
                    <div className="flex w-full gap-2 items-center">
                        <CoverImage
                            coverArt={album.coverArt}
                            coverArtType="album"
                            altText={album.name}
                        />
                        <div className="flex flex-col w-full justify-center truncate">
                            <Link
                                to={ROUTES.ALBUM.PAGE(album.id)}
                                className="font-medium truncate hover:underline"
                                onContextMenu={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                }}
                            >
                                {album.name}
                            </Link>
                            <div className="truncate text-xs text-foreground/70">
                                <ArtistLink artistId={album.artistId}>
                                    {album.artist}
                                </ArtistLink>
                            </div>
                        </div>
                    </div>
                );
            },
        },
        {
            id: "year",
            accessorKey: "year",
            header: i18n.t("table.columns.year"),
            style: {
                width: 80,
                maxWidth: 80,
            },
        },
    ];
}