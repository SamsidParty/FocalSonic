import { service } from "@/service/service";
import { queryKeys } from "@/utils/queryKeys";
import { useQuery } from "@tanstack/react-query";
import React from "react";

export default function SearchResults({ query }: { query: string }) {

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

    console.log(searchResult);

    return (
        <div className="p-4">
            <h2 className="text-lg font-semibold">Search results for "{query}"</h2>
            <pre>{JSON.stringify(searchResult, null, 2)}</pre>
        </div>
    );
}