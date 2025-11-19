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
    currentTime?: number; // Seconds
    timeSync: number; // Unix timestamp in milliseconds of when currentTime was recorded
}