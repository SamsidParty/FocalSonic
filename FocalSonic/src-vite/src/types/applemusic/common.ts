export interface AppleMusicResource {
    href?: string | undefined;
    id: string;
    type: string;
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

export interface AppleMusicEditorialNotes {
  name?: string;
  short?: string;
  standard?: string;
  tagline?: string;
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

export interface AppleMusicRelationship<ResourceType> {
    data: ResourceType[];
    href: string;
    meta?: any;
    next?: string | undefined;
}