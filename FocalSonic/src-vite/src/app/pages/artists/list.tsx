import { ShadowHeader } from "@/app/components/album/shadow-header";
import { ArtistGridCard } from "@/app/components/artist/artist-grid-card";
import Coverflow from "@/app/components/coverflow/coverflow";
import { ArtistsFallback } from "@/app/components/fallbacks/artists.tsx";
import { HeaderTitle } from "@/app/components/header-title";
import ListDisplayModePicker from "@/app/components/list-mode-picker";
import ListWrapper from "@/app/components/list-wrapper";
import { DataTable } from "@/app/components/ui/data-table";
import usePlayArtistRadio from "@/app/hooks/use-play-artist-radio";
import { artistsColumns } from "@/app/tables/artists-columns";
import { service } from "@/service/service";
import { useListDisplayMode } from "@/types/listDisplayMode";
import { ISimilarArtist } from "@/types/responses/artist";
import { queryKeys } from "@/utils/queryKeys";
import { checkServerType } from "@/utils/servers";
import { useQuery } from "@tanstack/react-query";
import React, { memo } from "react";

import { useTranslation } from "react-i18next";

const MemoShadowHeader = memo(ShadowHeader);
const MemoHeaderTitle = memo(HeaderTitle);
const MemoDataTable = memo(DataTable) as typeof DataTable;
const MemoListWrapper = memo(ListWrapper);

export default function ArtistsList() {
    const { t } = useTranslation();
    const { isAppleMusic } = checkServerType();

    const { displayMode, setDisplayMode } = useListDisplayMode("primary_artists");


    const { data: artists, isLoading } = useQuery({
        queryKey: [queryKeys.artist.all],
        queryFn: service.artists.getAll,
    });


    let ListDisplay = ArtistsListStandard;

    if (displayMode === "3dshelf") {
        ListDisplay = ArtistsListCoverflow;
    }
    else if (displayMode === "grid") {
        ListDisplay = ArtistsListGrid;
    }

    if (isLoading) return <ArtistsFallback />;
    if (!artists) return null;

    return (
        <div className="w-full h-full">
            <MemoShadowHeader className="flex justify-between">
                <MemoHeaderTitle title={t("sidebar.artists")} count={artists.length} />
                <ListDisplayModePicker className="ml-auto" displayMode={displayMode} setDisplayMode={setDisplayMode} />
            </MemoShadowHeader>
            <ListDisplay artists={artists} />
        </div>
    );
}


function ArtistsListGrid({ artists }: { artists: ISimilarArtist[] }) {
    return (
        <ListWrapper className="pt-shadow-header-distance px-0">
            <div className="grid grid-cols-6 2xl:grid-cols-8 gap-4 px-4" data-testid="artists-grid">
                {artists && artists.map((artist) => <ArtistGridCard key={artist.id || artist.name} artist={artist} />)}
            </div>
        </ListWrapper>
    );
}

function  ArtistsListCoverflow({ artists }: { artists: ISimilarArtist[] }) {
    return (
        <div className="w-full h-fs-content flex flex-col overflow-hidden">
            <div className="flex-1 h-full">
                <Coverflow items={artists} />
            </div>
        </div>
    );
}

function ArtistsListStandard({ artists }: { artists: ISimilarArtist[] }) {

    const { isAppleMusic } = checkServerType();
    const { playArtistRadio } = usePlayArtistRadio();


    const columns = artistsColumns();

    const columnFilter = [
        "index",
        "name",
        (!isAppleMusic && "albumCount"),
        (!isAppleMusic && "starred"),
    ];

    return (
        <MemoListWrapper className="pt-shadow-header-distance">
            <MemoDataTable
                columns={columns}
                columnFilter={columnFilter}
                data={artists}
                showPagination={true}
                showSearch={true}
                searchColumn="name"
                handlePlaySong={(row) => playArtistRadio(row.original)}
                allowRowSelection={false}
                dataType="artist"
            />
        </MemoListWrapper>
    );
}