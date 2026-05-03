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
    // Track the latest successful search and its results
    const latestSuccessfulSearchIdRef = useRef(0);
    const [lastResults, setLastResults] = useState<StoredResult | null>(null);
    const [lastError, setLastError] = useState<string | null>(null);

    const { data: searchResult, isLoading, isError, error } = useQuery({
        queryKey: [queryKeys.search, query],
        queryFn: async () => {
            const currentSearchId = latestSearchId;

            const result = await service.search.get({
                query,
                albumCount: 4,
                artistCount: 4,
                songCount: 4,
            });

            // Only update lastResults if this is still the latest search
            if (currentSearchId >= latestSuccessfulSearchIdRef.current) {
                latestSuccessfulSearchIdRef.current = currentSearchId;
                setLastResults({ searchId: currentSearchId, data: result });
                setLastError(null); // Clear error on success
                onSearchSuccess?.(query);
            }

            return result;
        },
        enabled: query.length >= 2,
        retry: 1, // Only retry once to avoid infinite loops
    });

    // Determine which results to display
    const isCurrentSearch = latestSearchId >= latestSuccessfulSearchIdRef.current;

    // Show current search results if available, otherwise show last successful results
    const displayData = isCurrentSearch && searchResult ? searchResult : lastResults?.data;

    const hasResults = displayData !== undefined;
    const hasAnyResults = hasResults && (
        (displayData?.top?.length ?? 0) > 0 ||
        (displayData?.song?.length ?? 0) > 0 ||
        (displayData?.album?.length ?? 0) > 0 ||
        (displayData?.artist?.length ?? 0) > 0 ||
        (displayData?.playlist?.length ?? 0) > 0
    );

    // For live search: only show results if this is the current search
    const shouldShowResults = isLiveSearch ? isCurrentSearch : true;

    // Only show "no results" after loading completes and query is still valid
    const showNoResults = !isLoading && !isError && isLiveSearch && shouldShowResults && query.length >= 2 && !hasAnyResults;

    // Show error but preserve last successful results
    const showError = isError && lastResults !== null;

    return (
        <div className="p-4">
            {query && (
                <h2 className="text-lg font-semibold mb-4">Search results for "{query}"</h2>
            )}

            {/* Loading state for live search */}
            {isLoading && isLiveSearch && shouldShowResults && (
                <div className="text-muted-foreground text-sm">Searching...</div>
            )}

            {/* Error state - show error message but keep old results visible */}
            {showError && (
                <div className="text-destructive text-sm mb-2">
                    {t("command.error") || "Search failed. Showing previous results."}
                </div>
            )}

            {/* Show results if we have data */}
            {shouldShowResults && hasAnyResults && displayData && (
                <>
                    <PreviewList title={t("sidebar.top")} list={displayData?.top} showMore={false} />
                    <PreviewList title={t("sidebar.songs")} list={displayData?.song} showMore={false} />
                    <PreviewList title={t("sidebar.albums")} list={displayData?.album} showMore={false} />
                    <PreviewList title={t("sidebar.artists")} list={displayData?.artist} showMore={false} />
                    <PreviewList title={t("sidebar.playlists")} list={displayData?.playlist} showMore={false} />
                </>
            )}

            {/* No results state - only show after loading completes with empty results */}
            {showNoResults && (
                <div className="text-muted-foreground text-sm">
                    {t("command.noResults")}
                </div>
            )}
        </div>
    );
}