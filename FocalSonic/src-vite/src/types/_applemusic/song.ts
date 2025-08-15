import { Resource } from "i18next";
import { AppleMusicAlbum } from "./albums";
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

export function convertAppleMusicSongToSubsonic(song: AppleMusicSong): Song {
    if (!song) { return; }

    return {
        isDir: false,
        id: song.attributes?.playParams?.catalogId || song.attributes?.playParams?.id || song.id,
        parent: song.attributes?.playParams?.catalogId || song.attributes?.playParams?.id || song.id,
        albumId: song.attributes?.playParams?.catalogId || song.attributes?.playParams?.id || song.id,
        title: song.attributes?.name || "Unknown",
        artist: song.attributes?.artistName || "Unknown",
        album: song.attributes?.albumName || "Unknown",
        duration: Math.ceil((song.attributes?.durationInMillis || 0) / 1000),
        suffix: "m4a",
        coverArt: song.attributes?.artwork?.url || "",
    };
}
