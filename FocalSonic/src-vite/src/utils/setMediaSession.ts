import { getCoverArtUrl } from "@/api/httpClient";
import { usePlayerStore } from "@/store/player.store";
import { ISong } from "@/types/responses/song";

const artworkSizes = ["96", "128", "192", "256", "384", "512"];

function removeMediaSession() {
    if (!navigator.mediaSession) return;

    navigator.mediaSession.metadata = null;
}

function setMediaSession(song: ISong) {
    if (!navigator.mediaSession) return;

    navigator.mediaSession.metadata = new MediaMetadata({
        title: song.title,
        artist: song.artist,
        album: song.album,
        artwork: artworkSizes.map((size): MediaImage => {
            return {
                src: getCoverArtUrl(song.coverArt, "song", size),
                sizes: [size, size].join("x"),
                type: "image/jpeg",
            };
        }),
    });
}

async function setRadioMediaSession(label: string, radioName: string) {
    if (!navigator.mediaSession) return;

    navigator.mediaSession.metadata = new MediaMetadata({
        title: radioName,
        artist: label,
        album: "",
        artwork: [
            {
                src: "",
                sizes: "",
                type: "",
            },
        ],
    });
}

function setPlaybackState(state: boolean | null) {
    if (!navigator.mediaSession) return;

    if (state === null) navigator.mediaSession.playbackState = "none";

    if (state) {
        navigator.mediaSession.playbackState = "playing";
    } else {
        navigator.mediaSession.playbackState = "paused";
    }
}

function setHandlers() {
    const { mediaSession } = navigator;
    if (!mediaSession) return;

    const state = usePlayerStore.getState();
    const { togglePlayPause, playNextSong, playPrevSong } = state.actions;

    mediaSession.setActionHandler("seekbackward", null);
    mediaSession.setActionHandler("seekforward", null);

    mediaSession.setActionHandler("play", () => togglePlayPause());
    mediaSession.setActionHandler("pause", () => togglePlayPause());
    mediaSession.setActionHandler("previoustrack", () => playPrevSong());
    mediaSession.setActionHandler("nexttrack", () => playNextSong());
}

export const manageMediaSession = {
    removeMediaSession,
    setMediaSession,
    setRadioMediaSession,
    setPlaybackState,
    setHandlers,
};
