export interface AppleMusicLyricsResponse {
    data: AppleMusicLyrics[];
}

export interface AppleMusicLyrics {
    attributes: AppleMusicLyricsAttributes;
}

export interface AppleMusicLyricsAttributes {
    ttml?: string;
}