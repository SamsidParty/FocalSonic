import { ShadowHeader } from "@/app/components/album/shadow-header";
import { InfinitySongListFallback } from "@/app/components/fallbacks/song-fallbacks";
import { HeaderTitle } from "@/app/components/header-title";
import { ClearFilterButton } from "@/app/components/search/clear-filter-button";
import { ExpandableSearchInput } from "@/app/components/search/expandable-input";
import { DataTableList } from "@/app/components/ui/data-table-list";
import { useLibraryVersion } from "@/app/hooks/use-library-sync";
import { useTotalSongs } from "@/app/hooks/use-total-songs";
import { songsColumns } from "@/app/tables/songs-columns";
import * as localLibrary from "@/lib/localLibrary";
import { getArtistAllSongs, songsSearch } from "@/queries/songs";
import { usePlayerActions } from "@/store/player.store";
import { ColumnFilter } from "@/types/columnFilter";
import { AlbumsFilters, AlbumsSearchParams } from "@/utils/albumsFilter";
import { queryKeys } from "@/utils/queryKeys";
import { SearchParamsHandler } from "@/utils/searchParamsHandler";
import { checkServerType } from "@/utils/servers";
import { useInfiniteQuery } from "@tanstack/react-query";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

const DEFAULT_OFFSET = 25;

export default function SongList() {
    const { t } = useTranslation();
    const { setSongList } = usePlayerActions();
    const [searchParams] = useSearchParams();
    const { getSearchParam } = new SearchParamsHandler(searchParams);
    const columns = songsColumns();
    const { isAppleMusic } = checkServerType();

    const filter = getSearchParam<string>(AlbumsSearchParams.MainFilter, "");
    const query = getSearchParam<string>(AlbumsSearchParams.Query, "");
    const artistId = getSearchParam<string>(AlbumsSearchParams.ArtistId, "");
    const artistName = getSearchParam<string>(AlbumsSearchParams.ArtistName, "");

    const searchFilterIsSet = filter === AlbumsFilters.Search && query !== "";
    const filterByArtist = artistId !== "" && artistName !== "";
    const hasSomeFilter = searchFilterIsSet || filterByArtist;

    // The synced local library is the source of truth. We only fall back to live
    // server queries until the first sync has populated it.
    const libraryVersion = useLibraryVersion();
    const libraryHasSongs = useMemo(
        () => localLibrary.getLibrarySongCount() > 0,
        [libraryVersion],
    );

    const librarySongs = useMemo(
        () => localLibrary.searchSongs({
            query: searchFilterIsSet ? query : "",
            artistId: filterByArtist ? artistId : "",
        }),
        [libraryVersion, query, artistId, searchFilterIsSet, filterByArtist],
    );

    async function fetchSongs({ pageParam = 0 }) {
        if (filterByArtist) {
            return getArtistAllSongs(artistId);
        }

        return songsSearch({
            query: searchFilterIsSet ? query : "",
            libraryOnly: true,
            songCount: DEFAULT_OFFSET,
            songOffset: pageParam,
        });
    }

    const {
        data,
        isLoading: serverIsLoading,
        isFetchingNextPage,
        fetchNextPage,
        hasNextPage,
    } = useInfiniteQuery({
        queryKey: [queryKeys.song.all, filter, query, artistId],
        initialPageParam: 0,
        queryFn: fetchSongs,
        getNextPageParam: (lastPage) => lastPage.nextOffset,
        enabled: !libraryHasSongs,
    });

    const { data: songCountData, isLoading: songCountIsLoading } = useTotalSongs();

    const serverSongs = data?.pages.flatMap((page) => page.songs) ?? [];
    const songlist = libraryHasSongs ? librarySongs.songs : serverSongs;

    if (!libraryHasSongs && serverIsLoading && !isFetchingNextPage) {
        return <InfinitySongListFallback />;
    }
    if (!libraryHasSongs && !data) return null;

    const songCount = (hasSomeFilter ? songlist.length : songCountData) ?? 0;

    function handlePlaySong(index: number) {
        if (songlist) setSongList(songlist, index);
    }

    const columnsToShow: ColumnFilter[] = [
        "index",
        "title",
        // 'artist',
        "album",
        "duration",
        (!isAppleMusic && "playCount"),
        (!isAppleMusic && "played"),
        (!isAppleMusic && "contentType"),
        (!isAppleMusic && "select"),
    ];

    const title = filterByArtist
        ? t("songs.list.byArtist", { artist: artistName })
        : t("sidebar.songs");

    return (
        <div className="w-full h-content">
            <ShadowHeader
                showGlassEffect={false}
                fixed={false}
                className="relative w-full justify-between items-center"
            >
                <HeaderTitle
                    title={title}
                    count={songCount}
                    loading={songCountIsLoading}
                />

                <div className="flex gap-2 flex-1 justify-end">
                    {filterByArtist && <ClearFilterButton />}
                    <ExpandableSearchInput
                        placeholder={t("songs.list.search.placeholder")}
                    />
                </div>
            </ShadowHeader>

            <div className="w-full h-[calc(100%-80px)] overflow-auto">
                <DataTableList
                    columns={columns}
                    data={songlist}
                    handlePlaySong={(row) => handlePlaySong(row.index)}
                    columnFilter={columnsToShow}
                    fetchNextPage={libraryHasSongs ? undefined : fetchNextPage}
                    hasNextPage={libraryHasSongs ? false : hasNextPage}
                />
            </div>
        </div>
    );
}
