import { AlbumGridCard } from "@/app/components/albums/album-grid-card";
import { EmptyAlbums } from "@/app/components/albums/empty-page";
import { AlbumsHeader } from "@/app/components/albums/header";
import { AlbumsFallback } from "@/app/components/fallbacks/album-fallbacks";
import ListWrapper from "@/app/components/list-wrapper";
import { ListDisplayMode } from "@/types/listDisplayMode";
import React, { useState } from "react";
import { useAlbumsListModel } from "./list.model";

export default function AlbumsList() {
    const { isLoading, isEmpty, albums, albumsCount } = useAlbumsListModel();

    const [displayMode, setDisplayMode] = useState<ListDisplayMode>("grid");

    if (isLoading) return <AlbumsFallback />;
    if (isEmpty) return <EmptyAlbums />;

    const ListDisplay = AlbumsListGrid;

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