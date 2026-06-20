import { useLibraryVersion } from "@/app/hooks/use-library-sync";
import * as localLibrary from "@/lib/localLibrary";
import { service } from "@/service/service";
import { useAppStore } from "@/store/app.store";
import { convertMinutesToMs } from "@/utils/convertSecondsToTime";
import { queryKeys } from "@/utils/queryKeys";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

async function fetchSongs(offset: number, count: number) {
    const response = await service.search.get({
        artistCount: 0,
        albumCount: 0,
        songCount: count,
        songOffset: offset,
    });
    return response?.song ?? [];
}

async function fetchTotalSongs() {
    const storedSongCount = useAppStore.getState().data.songCount;

    if (storedSongCount && storedSongCount > 0) {
        return storedSongCount;
    }

    const songCount = 100;
    let lowerBound = 0;
    let upperBound = songCount;

    while (true) {
        const songs = await fetchSongs(upperBound, songCount);

        if (songs.length < songCount) {
            break;
        } else {
            lowerBound = upperBound;
            upperBound *= 2;
        }
    }

    let totalSongs = lowerBound;

    while (lowerBound < upperBound) {
        const midPoint = Math.floor((lowerBound + upperBound) / 2);
        const songs = await fetchSongs(midPoint, songCount);

        if (songs.length < songCount) {
            upperBound = midPoint;
        } else {
            lowerBound = midPoint + songCount;
        }

        totalSongs = upperBound;
    }

    const songs = await fetchSongs(totalSongs, songCount);
    if (songs.length > 0) {
        totalSongs += songs.length;
    }

    useAppStore.setState((state) => {
        state.data.songCount = totalSongs;
    });

    return totalSongs;
}

/**
 * Total library song count. Once the local library has synced this is an instant
 * in-memory read; before that it falls back to the (slow) server probe so the
 * header count still renders on first run.
 */
export function useTotalSongs(): { data: number | undefined; isLoading: boolean } {
    const libraryVersion = useLibraryVersion();
    const libraryCount = useMemo(
        () => localLibrary.getLibrarySongCount(),
        [libraryVersion],
    );

    const query = useQuery({
        queryKey: [queryKeys.song.count],
        queryFn: fetchTotalSongs,
        staleTime: convertMinutesToMs(5),
        gcTime: convertMinutesToMs(5),
        enabled: libraryCount === 0,
    });

    if (libraryCount > 0) {
        return { data: libraryCount, isLoading: false };
    }

    return { data: query.data, isLoading: query.isLoading };
}
