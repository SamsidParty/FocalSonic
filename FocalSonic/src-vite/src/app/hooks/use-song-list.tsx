import { service } from "@/service/service";
import { checkServerType } from "@/utils/servers";

export function useSongList() {
    async function getArtistSongCount(id: string) {
        const response = await service.artists.getOne(id);
        let count = 0;

        if (!response || !response.album) return count;

        response.album.forEach((item) => {
            count += item.songCount;
        });

        return count;
    }

    async function getArtistAllSongs(nameOrID: string) {

        const { isAppleMusic } = checkServerType();

        if (isAppleMusic) {
            return service.songs.getTopSongs(nameOrID);
        }

        const response = await service.search.get({
            query: nameOrID,
            songCount: 9999999,
            albumCount: 0,
            artistCount: 0,
        });

        if (response?.song) return response.song;
    }

    async function getAlbumSongs(albumId: string) {
        const songs = await service.albums.getOne(albumId);

        if (songs?.song) return songs.song;
    }

    return {
        getArtistSongCount,
        getArtistAllSongs,
        getAlbumSongs,
    };
}
