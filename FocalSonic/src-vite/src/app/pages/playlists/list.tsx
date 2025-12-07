import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { PlusIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ShadowHeader } from "@/app/components/album/shadow-header";
import { SongListFallback } from "@/app/components/fallbacks/song-fallbacks";
import { HeaderTitle } from "@/app/components/header-title";
import ListWrapper from "@/app/components/list-wrapper";
import { EmptyPlaylistsPage } from "@/app/components/playlist/empty-page";
import { PlaylistGridCard } from "@/app/components/playlist/playlist-grid-card";
import { Button } from "@/app/components/ui/button";
import { playlistsColumns } from "@/app/tables/playlists-columns";
import { service } from "@/service/service";
import { usePlayerActions } from "@/store/player.store";
import { usePlaylists } from "@/store/playlists.store";
import { ColumnFilter } from "@/types/columnFilter";
import { queryKeys } from "@/utils/queryKeys";
import { checkServerType } from "@/utils/servers";
import React from "react";

export default function PlaylistsPage() {
    const { setPlaylistDialogState } = usePlaylists();
    const { setSongList } = usePlayerActions();
    const { t } = useTranslation();
    const { isAppleMusic } = checkServerType();

    const { data: playlists, isLoading } = useQuery({
        queryKey: [queryKeys.playlist.all],
        queryFn: service.playlists.getAll,
    });

    const columns = playlistsColumns();

    const columnsToShow: ColumnFilter[] = [
        "index",
        "name",
        (!isAppleMusic && "songCount"),
        (!isAppleMusic && "public"),
        (!isAppleMusic && "duration"),
        "actions"
    ];

    async function handlePlayPlaylist(playlistId: string) {
        const playlist = await service.playlists.getOne(playlistId);

        if (playlist && playlist.entry.length > 0) {
            setSongList(playlist.entry, 0);
        }
    }

    if (isLoading) return <SongListFallback />;
    if (!playlists) return null;

    const showTable = playlists.length > 0;

    return (
        <div className={clsx("w-full", showTable ? "h-full" : "h-content")}>
            <ShadowHeader>
                <div className="w-full flex items-center justify-between">
                    <HeaderTitle
                        title={t("sidebar.playlists")}
                        count={playlists.length}
                    />
                </div>

                <Button
                    size="sm"
                    variant="default"
                    className="px-4"
                    onClick={() => setPlaylistDialogState(true)}
                >
                    <PlusIcon className="w-5 h-5 -ml-[3px]" />
                    <span className="ml-2">{t("playlist.form.create.title")}</span>
                </Button>
            </ShadowHeader>

            {!showTable && <EmptyPlaylistsPage />}

            {showTable && (
                <ListWrapper className="pt-[calc(var(--shadow-header-distance)-0.5rem)] px-0">
                    <div className="grid grid-cols-5 2xl:grid-cols-6 gap-4 px-4" data-testid="playlists-grid">
                        {
                            playlists && playlists.map((playlist) => <PlaylistGridCard key={playlist.id} playlist={playlist} />)
                        }
                    </div>
                </ListWrapper>
            )}
        </div>
    );
}
