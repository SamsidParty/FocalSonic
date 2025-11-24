import { FocalAudioElement, getAudioElement } from "../helpers/dom";
import { createHlsInstance, FocalHls } from "../helpers/hls-instance";
import { MusicKitInstance } from "./instance";
import { PlaybackStates } from "./virtualmk-constants";

export interface QueueItemParam {
    song: string;
}

export class QueueItem  {
    song: string;
    hasInitialized: boolean = false;
    hls: FocalHls | null = null;
    audio: FocalAudioElement;
    parent: MusicKitInstance;

    constructor(param: QueueItemParam, parent: MusicKitInstance) {
        this.song = param.song;
        this.parent = parent;

        this.audio = document.createElement('audio');
        this.audio.className = `focalmk-audio-${this.song}`;
        this.audio.setAttribute('data-focalmk-id', this.song);
        document.body.appendChild(this.audio);
    }

    handleEnded() {
        this.parent.fireEvent("playbackStateDidChange", { oldState: PlaybackStates.playing, state: PlaybackStates.ended });
    }

    setActive() {
        console.log(`[FocalMK] Initializing HLS for song: ${this.song}`);
        this.hls = createHlsInstance(this.audio);
        this.audio.attachedHls = this.hls;

        // Find the previous audio element and remove it from being the main one
        getAudioElement().removeAttribute("id");

        // Set the current audio element to the main one
        this.audio.id = "apple-music-player";
        this.audio.addEventListener('ended', this.handleEnded.bind(this));
    }

    setInactive() {
        console.log(`[FocalMK] Deactivating song: ${this.song}`);
        this.audio.removeEventListener('ended', this.handleEnded.bind(this));
        this.audio.src = "";
        this.audio.removeAttribute("id");
    }
}