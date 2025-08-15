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
        isMasteredForItunes: boolean;
    } | undefined;
    relationships?: AppleMusicRelationship<AppleMusicAlbum> | undefined;
    type: "albums";
}

export function convertAppleMusicAlbumToSubsonic(album: AppleMusicAlbum): SingleAlbum {
    if (!album) { return; }
    return {
        isDir: true,
        id: album.id,
        name: album.attributes?.name || "",
        title: album.attributes?.name || "",
        artist: album.attributes?.artistName || "",
        albumArt: album.attributes?.artwork?.url || "",
        releaseDate: album.attributes?.releaseDate || "",
        genre: album.attributes?.genreNames[0] || "",
        trackCount: album.attributes?.trackCount || 0,
        coverArt: album.attributes?.artwork?.url || "",
        song: album.relationships?.tracks?.data.map(convertAppleMusicSongToSubsonic) || [],
    };
}