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
  attributes: AppleMusicAlbumAttributes | AppleMusicPlaylistAttributes | AppleMusicStationAttributes;
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
  editorialNotes?: {
    name?: string;
    short?: string;
    standard?: string;
    tagline?: string;
  };
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

export interface AppleMusicPlaylistAttributes {
  artwork: AppleMusicArtwork;
  audioTraits?: string[];
  curatorName?: string;
  description?: {
    standard: string;
    short?: string;
  };
  editorialNotes?: {
    name?: string;
    short?: string;
    standard?: string;
    tagline?: string;
  };
  hasCollaboration?: boolean;
  isChart?: boolean;
  lastModifiedDate?: string;
  name: string;
  playParams: AppleMusicPlayParams;
  playlistType?: string;
  supportsSing?: boolean;
  url: string;
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

export interface AppleMusicArtwork {
  bgColor: string;
  hasP3: boolean;
  height: number;
  textColor1: string;
  textColor2: string;
  textColor3: string;
  textColor4: string;
  url: string;
  width: number;
  gradient?: object;
}

export interface AppleMusicPlayParams {
  id: string;
  kind: string;
  versionHash?: string;
  format?: string;
  hasDrm?: boolean;
  mediaType?: number;
  stationHash?: string;
}