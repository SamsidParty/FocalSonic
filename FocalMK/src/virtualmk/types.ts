import { FocalAudioElement, getAudioElement } from "../helpers/dom";
import { createHlsInstance, FocalHls } from "../helpers/hls-instance";

export interface QueueItemParam {
    song: string;
}

export class QueueItem  {
    song: string;
    hasInitialized: boolean = false;
    hls: FocalHls | null = null;
    audio: FocalAudioElement;

    constructor(param: QueueItemParam) {
        this.song = param.song;

        this.audio = document.createElement('audio');
        this.audio.className = `focalmk-audio-${this.song}`;
        this.audio.setAttribute('data-focalmk-id', this.song);
        document.body.appendChild(this.audio);
    }

    setActive() {
        console.log(`[FocalMK] Initializing HLS for song: ${this.song}`);
        this.hls = createHlsInstance();
        this.audio.attachedHls = this.hls;

        // Find the previous audio element and remove it from being the main one
        getAudioElement().removeAttribute("id");

        // Set the current audio element to the main one
        this.audio.id = "apple-music-player";
    }
}