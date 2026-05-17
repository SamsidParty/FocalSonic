import clsx from "clsx";
import { t } from "i18next";
import { ArrowRightIcon } from "lucide-react";
import React, { useCallback, useRef, useState } from "react";
import { Form, useSearchParams } from "react-router-dom";
import { useDebouncedCallback } from "use-debounce";
import { Button } from "../components/ui/button";
import { SearchInput } from "../components/ui/searchinput";
import SearchResults from "./search-results";

export default function Search() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get("q");

    // No query param? Show the search page with input
    if (!query) {
        return <SearchPage />;
    }

    // Has query? Show results
    return <SearchResults query={query} latestSearchId={0} isLiveSearch={false} />;
}

function normalizeQuery(query: string): string {
    return query.trim().replace(/\s+/g, " ");
}


function SearchPage() {
    const [searchInput, setSearchInput] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const latestSearchIdRef = useRef(0);
    const lastSuccessfulQueryRef = useRef("");

    // Debounce to avoid spamming requests
    const debouncedSetQuery = useDebouncedCallback((value: string) => {
        const normalized = normalizeQuery(value);

        // Skip if same as last successful query
        if (normalized === lastSuccessfulQueryRef.current) {
            setIsSearching(false);
            return;
        }

        setDebouncedQuery(normalized);
        setIsSearching(false);
    }, 800);

    const handleInputChange = useCallback((value: string) => {
        setSearchInput(value);
        debouncedSetQuery.cancel();

        const normalized = normalizeQuery(value);

        // Don't search if input is too short - keep showing old results
        if (normalized.length < 2) {
            setIsSearching(false);
            return;
        }

        // Skip if same as last successful query
        if (normalized === lastSuccessfulQueryRef.current) {
            return;
        }

        latestSearchIdRef.current += 1;
        setIsSearching(true);
        debouncedSetQuery(normalized);
    }, [debouncedSetQuery]);

    // Handle Enter key
    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        debouncedSetQuery.cancel();

        const normalized = normalizeQuery(searchInput.trim());

        if (normalized.length >= 2) {
            if (normalized === lastSuccessfulQueryRef.current) {
                setIsSearching(false);
                return;
            }

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
                </div>
                <Button type="submit">
                    <ArrowRightIcon />
                </Button>
            </Form>

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