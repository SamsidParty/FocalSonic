import { httpClient } from "@/api/httpClient";
import { AppleMusicAlbum, convertAppleMusicAlbumToSubsonic } from "@/types/applemusic/albums";
import { AppleMusicSong, convertAppleMusicSongToSubsonic } from "@/types/applemusic/song";
import { Albums } from "@/types/responses/album";
import { merge } from "lodash";
import { LibrarySongsPage, LibrarySyncSource, SyncSong } from "../librarySyncTypes";
import { defaultAppleMusicQuery } from "./common";

// Apple Music caps library page size at 100 items.
const SONG_PAGE_SIZE = 100;

/**
 * Resolve the album that a library song belongs to. `include=albums` returns the
 * *library* album (its id differs from the catalog id), which we use as the
 * grouping key so every track of an album lands in the same bucket.
 */
function albumKeyFor(song: AppleMusicSong): { key: string; album?: AppleMusicAlbum } {
    const relationships = song.relationships as { albums?: { data?: AppleMusicAlbum[] } } | undefined;
    const libraryAlbum = relationships?.albums?.data?.[0];

    if (libraryAlbum?.id) {
        return { key: libraryAlbum.id, album: libraryAlbum };
    }

    // Fallback when the relationship is missing: group by album name + artist.
    const name = song.attributes?.albumName || "Unknown";
    const artist = song.attributes?.artistName || "Unknown";
    return { key: `am:${name}|${artist}` };
}

async function fetchSongsPage(offset: number, limit: number): Promise<LibrarySongsPage> {
    const response = await httpClient<AppleMusicSong[]>("/applemusic/me/library/songs", {
        method: "GET",
        query: merge({}, defaultAppleMusicQuery, {
            limit,
            offset,
            "include[library-songs]": "albums",
            "extend[library-songs]": "trackCount,tags,inFavorites,dateAdded",
            "extend[library-albums]": "trackCount,tags,inFavorites,dateAdded",
        }),
    });

    const data = response?.data ?? [];
    const total = (response as { meta?: { total?: number } })?.meta?.total ?? null;

    const albumsByKey = new Map<string, Albums>();

    const songs: SyncSong[] = data.map((raw) => {
        const { key, album } = albumKeyFor(raw);
        const converted = convertAppleMusicSongToSubsonic(raw, null);
        const dateAdded = (raw.attributes as { dateAdded?: string } | undefined)?.dateAdded;

        // `convertAppleMusicSongToSubsonic` doesn't carry year/genre; derive them
        // here so the year/genre album filters have data to work with.
        const releaseDate = raw.attributes?.releaseDate;
        const genre = raw.attributes?.genreNames?.filter((g) => g !== "Music")[0];
        const song = {
            ...converted,
            year: releaseDate ? new Date(releaseDate).getFullYear() : converted.year,
            genre: genre || converted.genre,
        };

        if (album && !albumsByKey.has(key)) {
            const convertedAlbum = convertAppleMusicAlbumToSubsonic(album);
            if (convertedAlbum) {
                albumsByKey.set(key, {
                    ...convertedAlbum,
                    id: key,
                    created: (album.attributes as { dateAdded?: string })?.dateAdded
                        || dateAdded || convertedAlbum.created,
                    genre: convertedAlbum.genre || song.genre || "",
                    year: convertedAlbum.year || song.year,
                });
            }
        } else if (!album && !albumsByKey.has(key)) {
            // Synthesize a minimal album from the song so it still appears in lists.
            albumsByKey.set(key, {
                id: key,
                name: song.album,
                artist: song.artist,
                artistId: song.artistId,
                coverArt: song.coverArt,
                songCount: 0,
                duration: 0,
                created: dateAdded || "",
                genre: song.genre || "",
                genres: [],
                year: song.year,
            } as Albums);
        }

        return { ...song, albumKey: key, created: dateAdded || song.created } as SyncSong;
    });

    return { songs, albums: Array.from(albumsByKey.values()), total };
}

export const librarySync: LibrarySyncSource = {
    songPageSize: SONG_PAGE_SIZE,
    fetchSongsPage,
    hasAlbumPass: false,
};
