import clsx from "clsx";
import { t } from "i18next";
import { ArrowRightIcon, Loader2Icon } from "lucide-react";
import React, { useCallback, useRef, useState } from "react";
import { Form, useSearchParams } from "react-router-dom";
import { useDebouncedCallback } from "use-debounce";
import { Button } from "../components/ui/button";
import { SearchInput } from "../components/ui/searchinput";
import SearchResults from "./search-results";

export default function Search() {
    // Get route params
    const [searchParams] = useSearchParams();
    const query = searchParams.get("q");

    // Return search page if the query param is not present
    if (!query) {
        return <SearchPage />;
    }

    // Render a simple results placeholder when a query is present
    return <SearchResults query={query} latestSearchId={0} isLiveSearch={false} />;
}

// Normalize query: trim and collapse multiple spaces to single space
function normalizeQuery(query: string): string {
    return query.trim().replace(/\s+/g, " ");
}


function SearchPage() {
    const [searchInput, setSearchInput] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const latestSearchIdRef = useRef(0);
    const lastSuccessfulQueryRef = useRef("");

    // Debounce callback - 800ms delay
    const debouncedSetQuery = useDebouncedCallback((value: string) => {
        const normalized = normalizeQuery(value);

        // Duplicate query protection - don't search if same as last successful
        if (normalized === lastSuccessfulQueryRef.current) {
            setIsSearching(false);
            return;
        }

        setDebouncedQuery(normalized);
        setIsSearching(false);
    }, 800);

    // Handle input change
    const handleInputChange = useCallback((value: string) => {
        setSearchInput(value);

        // Cancel any pending debounce
        debouncedSetQuery.cancel();

        const normalized = normalizeQuery(value);

        // Do NOT clear results when input is cleared - keep last results visible
        if (normalized.length < 2) {
            setIsSearching(false);
            return;
        }

        // Duplicate query protection - don't restart search if same as last successful
        if (normalized === lastSuccessfulQueryRef.current) {
            return;
        }

        // Increment search ID for new valid search
        latestSearchIdRef.current += 1;

        // Set searching state and debounce
        setIsSearching(true);
        debouncedSetQuery(normalized);
    }, [debouncedSetQuery]);

    // Handle form submit (Enter key)
    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();

        // Cancel debounce and search immediately
        debouncedSetQuery.cancel();
        const normalized = normalizeQuery(searchInput.trim());

        if (normalized.length >= 2) {
            // Duplicate query protection
            if (normalized === lastSuccessfulQueryRef.current) {
                setIsSearching(false);
                return;
            }

            // Increment search ID for immediate search
            latestSearchIdRef.current += 1;
            setDebouncedQuery(normalized);
            setIsSearching(false);
        }
    }, [debouncedSetQuery, searchInput]);

    const showResults = debouncedQuery.length >= 2;
    const showLoading = isSearching && debouncedQuery.length >= 2;

    return (
        <div
            className={
                clsx(
                    "flex flex-col h-screen items-start justify-start",
                    "pt-6 px-6",
                    "pb-player"
                )
            }
        >
            <Form
                className="w-full flex items-center justify-between gap-2 flex-row"
                onSubmit={handleSubmit}
            >
                <div className="relative flex-1">
                    <SearchInput
                        placeholder={t("command.inputPlaceholder")}
                        className="w-full pr-10"
                        name="q"
                        value={searchInput}
                        onChange={(e) => handleInputChange(e.target.value)}
                        autoFocus
                    />
                    {showLoading && (
                        <Loader2Icon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                </div>
                <Button type="submit">
                    <ArrowRightIcon />
                </Button>
            </Form>

            {/* Live Search Results - always render but conditionally show */}
            <div className="w-full mt-4">
                <SearchResults
                    query={debouncedQuery}
                    latestSearchId={latestSearchIdRef.current}
                    isLiveSearch={showResults}
                    onSearchSuccess={(query) => {
                        lastSuccessfulQueryRef.current = query;
                    }}
                />
            </div>
        </div>
    );
}