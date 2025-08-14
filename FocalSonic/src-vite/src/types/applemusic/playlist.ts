import { Playlist } from "../responses/playlist";
import { AppleMusicArtwork, AppleMusicEditorialNotes, AppleMusicPlayParams, AppleMusicRelationship, AppleMusicResource } from "./common";
import { AppleMusicCurator } from "./recommendations";
import { AppleMusicSong } from "./song";

export interface AppleMusicPlaylistResponse {
    data: AppleMusicPlaylist[];
}

export interface AppleMusicPlaylist extends AppleMusicResource {
    attributes?: {
        artwork?: AppleMusicArtwork | undefined;
        curatorName?: string | undefined;
        description?: AppleMusicEditorialNotes | undefined;
        lastModifiedDate: string;
        // `isChart` is not currently mentioned in the apple music api documentation:
        isChart?: boolean | undefined;
        name: string;
        playParams?: AppleMusicPlayParams | undefined;
        playlistType: "user-shared" | "editorial" | "external" | "personal-mix";
        url: string;
    } | undefined;

    relationships?: {
        curator: AppleMusicRelationship<AppleMusicCurator>;
        tracks?: AppleMusicRelationship<AppleMusicSong> | undefined;
    } | undefined;
    type: "playlists";
}

export function convertAppleMusicPlaylistToSubsonic(playlist: AppleMusicPlaylist): Playlist {
    if (!playlist) { return; }
    return {
        id: playlist.id,
        name: playlist.attributes?.name || "Playlist",
        comment: playlist.attributes?.description?.standard || "",
        coverArt: playlist.attributes?.artwork?.url || "",
        songCount: playlist.relationships?.tracks?.data.length || 0,
        duration: 0, // Duration is not provided in the Apple Music API
        public: playlist.attributes?.isChart || false,
        owner: "",
        changed: new Date(playlist.attributes?.lastModifiedDate || "").toString() || Date.now().toString(),
        created: new Date(playlist.attributes?.lastModifiedDate || "").toString() || Date.now().toString(),
        entry: playlist.relationships?.tracks?.data.map((track) => ({
            id: track.id,
            title: track.attributes?.name || "Unknown",
            artist: track.attributes?.artistName || "Unknown",
            album: track.attributes?.albumName || "Unknown",
            duration: (track.attributes?.durationInMillis || 0) / 1000,
            suffix: "m4a",
            coverArt: track.attributes?.artwork?.url || "",
        })) || [],
    };
}
