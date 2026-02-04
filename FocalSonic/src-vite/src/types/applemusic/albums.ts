import removeUndefined from "@/utils/removeUndefined";
import { Resource } from "i18next";
import { SingleAlbum } from "../responses/album";
import { AppleMusicArtwork, AppleMusicEditorialNotes, AppleMusicPlayParams, AppleMusicRelationship } from "./common";
import { convertAppleMusicSongToSubsonic } from "./song";

export interface AppleMusicAlbum extends Resource {
    // https://developer.apple.com/documentation/applemusicapi/album/attributes
    attributes?: {
        id: string;
        artistName: string;
        artwork?: AppleMusicArtwork | undefined;
        contentRating?: "clean" | "explicit" | undefined;
        copyright?: string | undefined;
        editorialNotes?: AppleMusicEditorialNotes | undefined;
        genreNames: string[];
        isCompilation: boolean;
        isComplete: boolean;
        isSingle: boolean;
        name: string;
        playParams?: AppleMusicPlayParams | undefined;
        recordLabel: string;
        releaseDate: string;
        trackCount: number;
        url: string;
        inFavorites: boolean;
        isMasteredForItunes: boolean;
    } | undefined;
    relationships?: AppleMusicRelationship<AppleMusicAlbum> | undefined;
    type: "albums";
}

export function convertAppleMusicAlbumToSubsonic(album: AppleMusicAlbum): SingleAlbum {
    if (!album) { return; }

    return removeUndefined({
        isDir: true,
        id: album.id,
        name: album.attributes?.name || "",
        title: album.attributes?.name || "",
        artist: album.attributes?.artistName || "",
        artistId: album.relationships?.artists?.data?.[0]?.id,
        artists: album.attributes?.artistName ? [{ name: album.attributes.artistName, id: album.relationships?.artists?.data?.[0]?.id }] : [],
        albumArt: album.attributes?.artwork?.url || "",
        releaseDate: album.attributes?.releaseDate || "",
        trackCount: album.attributes?.trackCount || 0,
        coverArt: album.attributes?.artwork?.url || "",
        song: album.relationships?.tracks?.data.map(convertAppleMusicSongToSubsonic) || [],
        starred: album.attributes?.inFavorites === true ? new Date().toISOString() : undefined,
        comment: album.attributes?.editorialNotes?.standard || "",
        genres: album.attributes?.genreNames?.map(name => ({ name })) || [],
        genre: album.attributes?.genreNames?.filter((g) => g != "Music").join(" / ") || "",
        year: album.attributes?.releaseDate ? new Date(album.attributes.releaseDate).getFullYear() : undefined,
        isNew: album.attributes?.releaseDate && (new Date().getTime() - new Date(album.attributes.releaseDate).getTime() < 14 * 24 * 60 * 60 * 1000) ? true : false, // Past two weeks release date
        appleMusic: {
            data: album
        }
    });
}