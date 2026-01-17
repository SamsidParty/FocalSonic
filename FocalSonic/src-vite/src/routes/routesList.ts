import { AlbumsFilters } from "@/utils/albumsFilter";

const LIBRARY = {
    HOME: "/",
    SEARCH: "/search",
    ARTISTS: "/library/artists",
    SONGS: "/library/songs",
    ALBUMS: "/library/albums",
    PLAYLISTS: "/library/playlists",
    PODCASTS: "/library/podcasts",
    EPISODES: "/library/episodes",
    PINS: "/library/pins",
    RADIOS: "/library/radios",
};

const ARTIST = {
    PAGE: (artistId: string) => `${LIBRARY.ARTISTS}/${artistId}`,
    PATH: `${LIBRARY.ARTISTS}/:artistId`,
};

const ALBUM = {
    PAGE: (albumId: string) => `${LIBRARY.ALBUMS}/${albumId}`,
    PATH: `${LIBRARY.ALBUMS}/:albumId`,
};

const ALBUMS = {
    GENRE: (genre: string) =>
        `${LIBRARY.ALBUMS}?filter=${AlbumsFilters.ByGenre}&genre=${encodeURIComponent(genre)}`,
    ARTIST: (id: string, name: string) =>
        `${LIBRARY.ALBUMS}?filter=${AlbumsFilters.ByDiscography}&artistId=${id}&artistName=${encodeURIComponent(name)}`,
    RECENTLY_PLAYED: `${LIBRARY.ALBUMS}?filter=${AlbumsFilters.RecentlyPlayed}`,
    MOST_PLAYED: `${LIBRARY.ALBUMS}?filter=${AlbumsFilters.MostPlayed}`,
    RECENTLY_ADDED: `${LIBRARY.ALBUMS}?filter=${AlbumsFilters.RecentlyAdded}`,
    RANDOM: `${LIBRARY.ALBUMS}?filter=${AlbumsFilters.Random}`,
    SEARCH: (query: string) =>
        `${LIBRARY.ALBUMS}?filter=${AlbumsFilters.Search}&query=${encodeURIComponent(query)}`,
};

const SONGS = {
    SEARCH: (query: string) =>
        `${LIBRARY.SONGS}?filter=${AlbumsFilters.Search}&query=${encodeURIComponent(query)}`,
    ARTIST_TRACKS: (id: string, name: string) =>
        `${LIBRARY.SONGS}?artistId=${id}&artistName=${encodeURIComponent(name)}`,
};

const PLAYLIST = {
    PAGE: (playlistId: string) => {
        if (playlistId.startsWith("folder:")) {
            // Handle playlist folders
            return `${LIBRARY.PLAYLISTS}?folderId=${encodeURIComponent(playlistId.substring(7))}`;
        }

        return `${LIBRARY.PLAYLISTS}/${playlistId}`;
    },
    PATH: `${LIBRARY.PLAYLISTS}/:playlistId`,
};

const PODCASTS = {
    PAGE: (podcastId: string) => `${LIBRARY.PODCASTS}/${podcastId}`,
    PATH: `${LIBRARY.PODCASTS}/:podcastId`,
};

const EPISODES = {
    PAGE: (episodeId: string) => `${LIBRARY.EPISODES}/${episodeId}`,
    PATH: `${LIBRARY.EPISODES}/:episodeId`,
    LATEST: `${LIBRARY.EPISODES}/latest`,
};

const SERVER_CONFIG = "/server-config";

export const ROUTES = {
    LIBRARY,
    ARTIST,
    ALBUM,
    ALBUMS,
    SONGS,
    PLAYLIST,
    PODCASTS,
    EPISODES,
    SERVER_CONFIG,
};
