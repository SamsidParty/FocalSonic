import { service } from "@/service/service";
import { AlbumListParams } from "@/service/subsonic/albums";
import { checkServerType } from "@/utils/servers";

const emptyResponse = { albums: [], nextOffset: null, albumsCount: 0 };

export async function getArtistDiscography(artistId: string) {
    const response = await service.artists.getOne(artistId);

    if (!response || !response.album) return emptyResponse;

    return {
        albums: response.album,
        nextOffset: null,
        albumsCount: response.album.length,
    };
}

interface AlbumSearch {
    query: string
    count: number
    offset: number
}

export async function albumSearch({ query, count, offset }: AlbumSearch) {
    const response = await service.search.get({
        query,
        songCount: 0,
        artistCount: 0,
        albumCount: count,
        albumOffset: offset,
    });

    if (!response) return emptyResponse;
    if (!response.album) return emptyResponse;

    let nextOffset = null;
    if (response.album.length >= count) {
        nextOffset = offset + count;
    }

    return {
        albums: response.album,
        nextOffset,
        albumsCount: offset + response.album.length,
    };
}

export async function getAlbumList(params: Required<AlbumListParams>) {
    const response = await service.albums.getAlbumList(params);
    const { isAppleMusic } = checkServerType();

    if (!response) return emptyResponse;
    if (!response.list) return emptyResponse;

    let nextOffset = null;
    if (response.list.length >= params.size) {
        nextOffset = params.offset + params.size;
    }

    if (isAppleMusic) {
        // Apple music doesn't support server side sort/filter, so do it client side
        if (params.type === "byYear") {
            response.list.sort((a, b) => {
                return (b.year ?? 0) - (a.year ?? 0);
            });
            if (params.fromYear > params.toYear) {
                response.list = response.list.reverse();
            }
        }
        else if (params.type === "newest") {
            response.list.sort((a, b) => {
                return new Date(b.created).getTime() - new Date(a.created).getTime();
            });
        }
        else if (params.type === "alphabeticalByName") {
            response.list.sort((a, b) => {
                return (b.name ?? "").localeCompare(a.name ?? "");
            });
        }
        else if (params.type === "alphabeticalByArtist") {
            response.list.sort((a, b) => {
                return (b.artist ?? "").localeCompare(a.artist ?? "");
            });
        }
    }

    return {
        albums: response.list,
        nextOffset,
        albumsCount: response.albumsCount || 0,
    };
}
