export interface Status {
    isLoading?: boolean;
    isError?: boolean;
    statusCode?: string;
    statusMessage: string;
    metadata?: MediaMetadata;
}

export interface MediaMetadata {
    playbackInterface: string;
    mediaId: string;
    title: string;
    artist: string;
    album?: string;
    artworkUrl?: string;
}