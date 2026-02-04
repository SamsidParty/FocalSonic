import { AlbumGridCard } from "@/app/components/albums/album-grid-card";
import { EmptyAlbums } from "@/app/components/albums/empty-page";
import { AlbumsHeader } from "@/app/components/albums/header";
import Coverflow from "@/app/components/coverflow/coverflow";
import { AlbumsFallback } from "@/app/components/fallbacks/album-fallbacks";
import ListWrapper from "@/app/components/list-wrapper";
import usePreviewCard from "@/app/components/preview-card/use-preview-card";
import { DataTableList } from "@/app/components/ui/data-table-list";
import { songsColumns } from "@/app/tables/songs-columns";
import { ColumnFilter } from "@/types/columnFilter";
import { ListDisplayMode } from "@/types/listDisplayMode";
import { t } from "i18next";
import React, { useState } from "react";
import { useAlbumsListModel } from "./list.model";

export default function AlbumsList() {
    const { isLoading, isEmpty, albums, albumsCount } = useAlbumsListModel();

    const [displayMode, setDisplayMode] = useState<ListDisplayMode>("grid");

    if (isLoading) return <AlbumsFallback />;
    if (isEmpty) return <EmptyAlbums />;

    let ListDisplay = AlbumsListStandard;

    if (displayMode === "3dshelf") {
        ListDisplay = AlbumsListCoverflow;
    }
    else if (displayMode === "grid") {
        ListDisplay = AlbumsListGrid;
    }


    return (
        <div className="w-full h-full">
            <AlbumsHeader displayMode={displayMode} setDisplayMode={setDisplayMode} albumCount={albumsCount} />
            <ListDisplay albums={albums} />
        </div>
    );
}

function AlbumsListGrid({ albums }) {
    return (
        <ListWrapper className="pt-[calc(var(--shadow-header-distance)-0.5rem)] px-0">
            <div className="grid grid-cols-6 2xl:grid-cols-8 gap-4 px-4" data-testid="albums-grid" type="albums">
                {
                    albums && albums.map((album) => <AlbumGridCard key={album.id} album={album} />)
                }
            </div>
        </ListWrapper>
    );
}

function AlbumsListStandard({ albums }) {

    const columns = songsColumns();
    const { navigateToResource, handlePlay } = usePreviewCard();

    const columnsToShow: ColumnFilter[] = [
        "index",
        "title",
        "year"
    ];

    return (
        <ListWrapper className="pt-shadow-header px-0 pb-0">
            <DataTableList
                columns={columns}
                data={albums}
                handlePlaySong={(row) => handlePlay(albums[row.index])}
                handleLeftClick={(row) => navigateToResource(albums[row.index])}
                allowRowSelection={false}
                columnFilter={columnsToShow}
                noRowsMessage={t("album.list.empty.title")}
            />
        </ListWrapper>
    );
}

function AlbumsListCoverflow({ albums }) {
    return (
        <div className="w-full h-fs-content flex flex-col overflow-hidden">
            <div className="flex-1 h-full">
                <Coverflow items={albums} />
            </div>
        </div>
    );
}