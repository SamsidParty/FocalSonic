import { Resource } from "i18next";
import { ISimilarArtist } from "../responses/artist";
import { AppleMusicAlbum } from "./albums";
import { AppleMusicEditorialNotes, AppleMusicGenre, AppleMusicRelationship } from "./common";

export interface AppleMusicArtist extends Resource {
    attributes?: {
        editorialNotes?: AppleMusicEditorialNotes | undefined;
        genreNames: string[];
        name: string;
        url: string;
    } | undefined;
    relationships?: AppleMusicArtistRelationships | undefined;
    type: "artists";
}

export interface AppleMusicArtistRelationships {
    albums: AppleMusicRelationship<AppleMusicAlbum>;
    genres?: AppleMusicRelationship<AppleMusicGenre> | undefined;
}

export function convertAppleMusicArtistToSubsonic(artist: AppleMusicArtist, appleMusicData: any): ISimilarArtist {
    if (!artist) { return; }
    return {
        id: artist.id,
        name: artist.attributes?.name,
        coverArt: artist.attributes?.artwork?.url || "",
        artistImageUrl: artist.attributes?.artwork?.url || "",
        appleMusic: appleMusicData || { data: [artist] }
    };
}