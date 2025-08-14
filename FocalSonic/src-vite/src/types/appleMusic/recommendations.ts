import { AppleMusicArtwork, AppleMusicEditorialNotes, AppleMusicPlayParams, AppleMusicRelationship, AppleMusicResource } from "./common";
import { AppleMusicPlaylist } from "./playlist";

export interface AppleMusicRecommendationsResponse {
  data: AppleMusicRecommendation[];
  meta: {
    metrics: Record<string, string>;
  };
}

export interface AppleMusicRecommendation {
  id: string;
  type: string;
  href: string;
  attributes: AppleMusicRecommendationAttributes;
  relationships: {
    contents: {
      href: string;
      data: AppleMusicRecommendationContent[];
    };
  };
  meta: {
    cachePolicy?: {
      updateDate: string;
    };
    metrics?: Record<string, string>;
  };
}

export interface AppleMusicRecommendationAttributes {
  display: {
    decorations: any[];
    kind: string;
  };
  hasSeeAll: boolean;
  isGroupRecommendation: boolean;
  kind: string;
  nextUpdateDate: string;
  resourceTypes: string[];
  title: {
    stringForDisplay: string;
  };
  version: number;
}

export interface AppleMusicRecommendationContent {
  id: string;
  type: string;
  href: string;
  attributes: AppleMusicAlbumAttributes | AppleMusicPlaylist | AppleMusicStationAttributes;
  meta?: {
    contentVersion?: Record<string, number>;
  };
}


export interface AppleMusicAlbumAttributes {
  artistName?: string;
  artwork: AppleMusicArtwork;
  audioTraits?: string[];
  curatorName?: string;
  description?: {
    standard: string;
    short?: string;
  };
  editorialNotes?: AppleMusicEditorialNotes;
  hasCollaboration?: boolean;
  isChart?: boolean;
  lastModifiedDate?: string;
  name: string;
  playParams: AppleMusicPlayParams;
  playlistType?: string;
  supportsSing?: boolean;
  url: string;
  copyright?: string;
  genreNames?: string[];
  isCompilation?: boolean;
  isComplete?: boolean;
  isMasteredForItunes?: boolean;
  isPrerelease?: boolean;
  isSingle?: boolean;
  recordLabel?: string;
  releaseDate?: string;
  trackCount?: number;
  upc?: string;
  contentRating?: string;
}

export interface AppleMusicStationAttributes {
  artwork: AppleMusicArtwork;
  isLive: boolean;
  kind: string;
  mediaKind: string;
  name: string;
  playParams: AppleMusicPlayParams;
  radioUrl: string;
  requiresSubscription: boolean;
  url: string;
}


export interface AppleMusicCurator extends AppleMusicResource {
    attributes?: {
        artwork?: AppleMusicArtwork | undefined;
        editorialNotes?: AppleMusicEditorialNotes | undefined;
        name: string;
        url: string;
    } | undefined;
    relationships?: {
        playlists?: AppleMusicRelationship<AppleMusicPlaylist> | undefined;
    } | undefined;
    type: "curators";
} 