import { ClockIcon, StarIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { ArtistLink, ArtistsLinks } from "@/app/components/song/artist-link";
import PlaySongButton from "@/app/components/table/play-button";
import { SongTableActions } from "@/app/components/table/song-actions";
import { TableSongTitle } from "@/app/components/table/song-title";
import { Badge } from "@/app/components/ui/badge";
import { DataTableColumnHeader } from "@/app/components/ui/data-table-column-header";
import { SimpleTooltip } from "@/app/components/ui/simple-tooltip";
import i18n from "@/i18n";
import { ROUTES } from "@/routes/routesList";
import { ColumnDefType } from "@/types/react-table/columnDef";
import { ISong } from "@/types/responses/song";
import { convertSecondsToTime } from "@/utils/convertSecondsToTime";
import dateTime from "@/utils/dateTime";

export function songsColumns(): ColumnDefType<ISong>[] {
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
                const trackNumber = row.index + 1;
                const song = row.original;

                return (
                    <PlaySongButton
                        trackNumber={trackNumber}
                        trackId={song.id}
                        handlePlayButton={() => table.options.meta?.handlePlaySong?.(row)}
                    />
                );
            },
        },
        {
            id: "trackNumber",
            accessorKey: "track",
            style: {
                width: 48,
                minWidth: "48px",
            },
            header: () => {
                return <div className="w-full text-center">#</div>;
            },
            cell: ({ row, table }) => {
                const song = row.original;
                const trackNumber = song.track;

                return (
                    <PlaySongButton
                        trackNumber={trackNumber}
                        trackId={song.id}
                        handlePlayButton={() => table.options.meta?.handlePlaySong?.(row)}
                    />
                );
            },
        },
        {
            id: "title",
            accessorKey: "title",
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
            cell: ({ row }) => <TableSongTitle song={row.original} />,
        },
        {
            id: "artist",
            accessorKey: "artist",
            style: {
                width: "20%",
                maxWidth: "20%",
            },
            enableSorting: true,
            sortingFn: "customSortFn",
            header: ({ column, table }) => (
                <DataTableColumnHeader column={column} table={table}>
                    {i18n.t("table.columns.artist")}
                </DataTableColumnHeader>
            ),
            cell: ({ row }) => {
                const { artist, artistId, artists } = row.original;

                if (artists && artists.length > 1) {
                    return <ArtistsLinks artists={artists} />;
                }

                if (!artistId) return artist;

                return <ArtistLink artistId={artistId}>{artist}</ArtistLink>;
            },
        },
        {
            id: "album",
            accessorKey: "album",
            style: {
                width: "24%",
                minWidth: "14%",
                maxWidth: "24%",
            },
            className: "hidden lg:flex",
            enableSorting: true,
            sortingFn: "customSortFn",
            header: ({ column, table }) => (
                <DataTableColumnHeader column={column} table={table}>
                    {i18n.t("table.columns.album")}
                </DataTableColumnHeader>
            ),
            cell: ({ row }) => {
                return (
                    <Link
                        to={ROUTES.ALBUM.PAGE(row.original.albumId)}
                        className="hover:underline truncate text-foreground/70 hover:text-foreground"
                        onContextMenu={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                        }}
                    >
                        {row.original.album}
                    </Link>
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
        {
            id: "duration",
            accessorKey: "duration",
            style: {
                width: 80,
                maxWidth: 80,
            },
            enableSorting: true,
            sortingFn: "basic",
            header: ({ column, table }) => (
                <SimpleTooltip text={i18n.t("table.columns.duration")}>
                    <div>
                        <DataTableColumnHeader column={column} table={table}>
                            <ClockIcon className="w-4 h-4" />
                        </DataTableColumnHeader>
                    </div>
                </SimpleTooltip>
            ),
            cell: ({ row }) => {
                const { duration } = row.original;
                const formattedDuration = convertSecondsToTime(duration ?? 0);

                return formattedDuration;
            },
        },
        {
            id: "playCount",
            accessorKey: "playCount",
            style: {
                width: 140,
                maxWidth: 140,
            },
            className: "hidden lg:flex",
            enableSorting: true,
            sortingFn: "basic",
            sortUndefined: -1,
            header: ({ column, table }) => (
                <DataTableColumnHeader column={column} table={table}>
                    {i18n.t("table.columns.plays")}
                </DataTableColumnHeader>
            ),
            cell: ({ row }) => row.original.playCount ?? 0,
        },
        {
            id: "played",
            accessorKey: "played",
            header: i18n.t("table.columns.lastPlayed"),
            style: {
                width: 180,
                maxWidth: 180,
            },
            className: "hidden 2xl:flex",
            cell: ({ row }) => {
                const { played } = row.original;

                if (played) {
                    const lastPlayed = dateTime().from(dateTime(played), true);
                    return i18n.t("table.lastPlayed", { date: lastPlayed });
                }

                return "";
            },
        },
        {
            id: "bpm",
            accessorKey: "bpm",
            header: i18n.t("table.columns.bpm"),
            style: {
                width: 80,
                maxWidth: 80,
            },
        },
        {
            id: "bitRate",
            accessorKey: "bitRate",
            header: i18n.t("table.columns.bitrate"),
            style: {
                width: 140,
                maxWidth: 140,
            },
            className: "hidden 2xl:flex",
            cell: ({ row }) => {
                return `${row.original.bitRate} kbps`;
            },
        },
        {
            id: "contentType",
            accessorKey: "contentType",
            header: i18n.t("table.columns.quality"),
            style: {
                width: 100,
                maxWidth: 110,
            },
            className: "hidden 2xl:flex",
            cell: ({ row }) => {
                const { suffix } = row.original;

                return <Badge>{suffix.toUpperCase()}</Badge>;
            },
        },
        {
            id: "select",
            style: {
                width: 120,
                maxWidth: 120,
                justifyContent: "end",
            },
            header: () => (
                <SimpleTooltip text={i18n.t("table.columns.favorite")}>
                    <StarIcon className="w-4 h-4 mr-2" />
                </SimpleTooltip>
            ),
            cell: ({ row }) => <SongTableActions row={row} />,
        },
    ];
}
