import ImageHeader from "@/app/components/album/image-header";
import { PlaylistFallback } from "@/app/components/fallbacks/playlist-fallbacks";
import { BadgesData } from "@/app/components/header-info";
import ListWrapper from "@/app/components/list-wrapper";
import { PlaylistButtons } from "@/app/components/playlist/buttons";
import { RemoveSongFromPlaylistDialog } from "@/app/components/playlist/remove-song-dialog";
import { DataTable } from "@/app/components/ui/data-table";
import ErrorPage from "@/app/pages/error-page";
import { songsColumns } from "@/app/tables/songs-columns";
import { makeQueryPersistent } from "@/lib/queryClient";
import { service } from "@/service/service";
import { usePlayerActions } from "@/store/player.store";
import { ColumnFilter } from "@/types/columnFilter";
import { convertSecondsToHumanRead } from "@/utils/convertSecondsToTime";
import { queryKeys } from "@/utils/queryKeys";
import { checkServerType } from "@/utils/servers";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

export default function Playlist() {
    const { playlistId } = useParams() as { playlistId: string };
    const { t } = useTranslation();
    const columns = songsColumns();
    const { isAppleMusic } = checkServerType();
    const { setSongList } = usePlayerActions();

    const {
        data: playlist,
        isLoading,
    } = useQuery(makeQueryPersistent({
        queryKey: [queryKeys.playlist.single, playlistId],
        queryFn: () => service.playlists.getOne(playlistId),
    }));

    if (isLoading) return <PlaylistFallback />;
    if (!playlist) return <ErrorPage status={404} statusText="Not Found" />;

    const columnsToShow: ColumnFilter[] = [
        "index",
        "title",
        "album",
        "duration",
        (!isAppleMusic && "playCount"),
        (!isAppleMusic && "contentType"),
        (!isAppleMusic && "select")
    ];

    const hasSongs = playlist.songCount > 0;
    const duration = playlist.duration && convertSecondsToHumanRead(playlist.duration);

    const songCount = hasSongs
        ? t("playlist.songCount", { count: playlist.songCount })
        : null;
    const playlistDuration = (hasSongs && duration)
        ? t("playlist.duration", { duration })
        : null;

    const badges: BadgesData = [
        { content: songCount, type: "text" },
        {
            content: playlistDuration,
            type: "text",
        },
    ];

    const coverArt = playlist.songCount > 0 ? playlist.coverArt : undefined;

    return (
        <div className="w-full" key={playlist.id}>
            <ImageHeader
                type={t("playlist.headline")}
                albumId={playlist.id}
                title={playlist.name}
                subtitle={playlist.comment}
                coverArtId={coverArt}
                coverArtType="album"
                coverArtSize="700"
                coverArtAlt={playlist.name}
                badges={badges}
                isPlaylist={true}
            />

            <ListWrapper>
                <PlaylistButtons playlist={playlist} />

                <DataTable
                    columns={columns}
                    data={playlist.entry ?? []}
                    handlePlaySong={(row) => setSongList(playlist.entry, row.index)}
                    columnFilter={columnsToShow}
                    noRowsMessage={t("playlist.noSongList")}
                    variant="modern"
                />

                <RemoveSongFromPlaylistDialog />
            </ListWrapper>
        </div>
    );
}
