import { Resource } from "i18next";
import { AppleMusicArtwork, AppleMusicEditorialNotes, AppleMusicPlayParams, AppleMusicRelationship } from "./common";

export interface AppleMusicLyricsResponse {
    data: AppleMusicLyrics[];
}

export interface AppleMusicLyrics {
    attributes: AppleMusicLyricsAttributes;
}

export interface AppleMusicLyricsAttributes {
    ttml?: string;
}

export interface AppleMusicSong extends Resource {
    type: "songs";
    // https://developer.apple.com/documentation/applemusicapi/song/attributes
    attributes?: {
        albumName: string;
        artistName: string;
        artwork?: AppleMusicArtwork | undefined;
        composerName?: string | undefined;
        contentRating?: string | undefined;
        discNumber: number;
        durationInMillis: number;
        editorialNotes?: AppleMusicEditorialNotes | undefined;
        genreNames: string[];
        hasLyrics: boolean;
        isrc: string;
        movementCount?: number | undefined;
        movementName?: string | undefined;
        movementNumber?: string | undefined;
        name: string;
        playParams?: AppleMusicPlayParams | undefined;
        previews: AppleMusicPreview[];
        releaseDate: string;
        trackNumber: number;
        url: string;
        workName?: string | undefined;
    } | undefined;
    relationships?: AppleMusicSongRelationships | undefined;
}

// https://developer.apple.com/documentation/applemusicapi/song/relationships
export interface AppleMusicSongRelationships {
    albums: AppleMusicRelationship<AppleMusicAlbum>;
    artists: AppleMusicRelationship<AppleMusicArtist>;
    genres?: AppleMusicRelationship<AppleMusicGenre> | undefined;
    station?: { data: AppleMusicStation } | undefined;
}