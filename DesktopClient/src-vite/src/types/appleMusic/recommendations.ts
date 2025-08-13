export interface IAppleMusicRecommendationsResponse {
  data: IAppleMusicRecommendation[];
  meta: {
    metrics: Record<string, string>;
  };
}

export interface IAppleMusicRecommendation {
  id: string;
  type: string;
  href: string;
  attributes: IAppleMusicRecommendationAttributes;
  relationships: {
    contents: {
      href: string;
      data: IAppleMusicRecommendationContent[];
    };
  };
  meta: {
    cachePolicy?: {
      updateDate: string;
    };
    metrics?: Record<string, string>;
  };
}

export interface IAppleMusicRecommendationAttributes {
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

export interface IAppleMusicRecommendationContent {
  id: string;
  type: string;
  href: string;
  attributes: IAlbumAttributes | IPlaylistAttributes | IStationAttributes;
  meta?: {
    contentVersion?: Record<string, number>;
  };
}

// Album/Playlist/Station attributes (partial, extend as needed)
export interface IAlbumAttributes {
  artistName?: string;
  artwork: IArtwork;
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
  playParams: IPlayParams;
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

export interface IPlaylistAttributes {
  artwork: IArtwork;
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
  playParams: IPlayParams;
  playlistType?: string;
  supportsSing?: boolean;
  url: string;
}

export interface IStationAttributes {
  artwork: IArtwork;
  isLive: boolean;
  kind: string;
  mediaKind: string;
  name: string;
  playParams: IPlayParams;
  radioUrl: string;
  requiresSubscription: boolean;
  url: string;
}

export interface IArtwork {
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

export interface IPlayParams {
  id: string;
  kind: string;
  versionHash?: string;
  format?: string;
  hasDrm?: boolean;
  mediaType?: number;
  stationHash?: string;
}