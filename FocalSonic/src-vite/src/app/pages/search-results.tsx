import { service } from "@/service/service";
import { queryKeys } from "@/utils/queryKeys";
import { useQuery } from "@tanstack/react-query";
import { t } from "i18next";
import React, { useRef, useState } from "react";
import PreviewList from "../components/home/preview-list";

interface SearchResultsProps {
    query: string;
    latestSearchId: number;
    isLiveSearch?: boolean;
    onSearchSuccess?: (query: string) => void;
}

interface StoredResult {
    searchId: number;
    data: Awaited<ReturnType<typeof service.search.get>>;
}

export default function SearchResults({ query, latestSearchId, isLiveSearch, onSearchSuccess }: SearchResultsProps) {
    // Keep track of successful searches to avoid stale results overwriting newer ones
    const latestSuccessfulSearchIdRef = useRef(0);
    const [lastResults, setLastResults] = useState<StoredResult | null>(null);
    const [lastError, setLastError] = useState<string | null>(null);

    const { data: searchResult, isLoading, isError } = useQuery({
        queryKey: [queryKeys.search, query],
        queryFn: async () => {
            const currentSearchId = latestSearchId;

            const result = await service.search.get({
                query,
                albumCount: 4,
                artistCount: 4,
                songCount: 4,
            });

            // Only save if this is still the most recent search
            if (currentSearchId >= latestSuccessfulSearchIdRef.current) {
                latestSuccessfulSearchIdRef.current = currentSearchId;
                setLastResults({ searchId: currentSearchId, data: result });
                setLastError(null);
                onSearchSuccess?.(query);
            }

            return result;
        },
        enabled: query.length >= 2,
        retry: 1,
    });

    const isCurrentSearch = latestSearchId >= latestSuccessfulSearchIdRef.current;
    const displayData = isCurrentSearch && searchResult ? searchResult : lastResults?.data;

    const hasResults = displayData !== undefined;
    const hasAnyResults = hasResults && (
        (displayData?.top?.length ?? 0) > 0 ||
        (displayData?.song?.length ?? 0) > 0 ||
        (displayData?.album?.length ?? 0) > 0 ||
        (displayData?.artist?.length ?? 0) > 0 ||
        (displayData?.playlist?.length ?? 0) > 0
    );

    // Only show live search results if they're the most recent
    const shouldShowResults = isLiveSearch ? isCurrentSearch : true;

    // Show no results only after loading finishes and we have nothing
    const showNoResults = !isLoading && !isError && isLiveSearch && shouldShowResults && query.length >= 2 && !hasAnyResults;

    // If error but we have old results, show error but keep old results visible
    const showError = isError && lastResults !== null;

    return (
        <div className="p-4">
            {query && (
                <h2 className="text-lg font-semibold mb-4">Search results for "{query}"</h2>
            )}

            {isLoading && isLiveSearch && shouldShowResults && (
                <div className="text-muted-foreground text-sm">Searching...</div>
            )}

            {showError && (
                <div className="text-destructive text-sm mb-2">
                    {t("command.error") || "Search failed. Showing previous results."}
                </div>
            )}

            {shouldShowResults && hasAnyResults && displayData && (
                <>
                    <PreviewList title={t("sidebar.top")} list={displayData?.top} showMore={false} />
                    <PreviewList title={t("sidebar.songs")} list={displayData?.song} showMore={false} />
                    <PreviewList title={t("sidebar.albums")} list={displayData?.album} showMore={false} />
                    <PreviewList title={t("sidebar.artists")} list={displayData?.artist} showMore={false} />
                    <PreviewList title={t("sidebar.playlists")} list={displayData?.playlist} showMore={false} />
                </>
            )}

            {showNoResults && (
                <div className="text-muted-foreground text-sm">
                    {t("command.noResults")}
                </div>
            )}
        </div>
    );
}