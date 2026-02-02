import { service } from "@/service/service";
import { queryKeys } from "@/utils/queryKeys";
import { checkServerType } from "@/utils/servers";
import { useQuery } from "@tanstack/react-query";
import { t } from "i18next";
import React from "react";
import PreviewList from "../components/home/preview-list";

export default function SearchResults({ query }: { query: string }) {

    const { isAppleMusic } = checkServerType();

    const { data: searchResult } = useQuery({
        queryKey: [queryKeys.search, query],
        queryFn: () =>
            service.search.get({
                query,
                albumCount: 4,
                artistCount: 4,
                songCount: 4,
            })
    });

    return (
        <div className="p-4">
            <h2 className="text-lg font-semibold">Search results for "{query}"</h2>
            {
                searchResult !== undefined && (
                    <>
                        <PreviewList title={t("sidebar.top")} list={searchResult?.top} showMore={false} />
                        <PreviewList title={t("sidebar.songs")} list={searchResult?.song} showMore={false} />
                        <PreviewList title={t("sidebar.albums")} list={searchResult?.album} showMore={false} />
                        <PreviewList title={t("sidebar.artists")} list={searchResult?.artist} showMore={false} />
                        <PreviewList title={t("sidebar.playlists")} list={searchResult?.playlist} showMore={false} />
                    </>
                )
            }
        </div>
    );
}