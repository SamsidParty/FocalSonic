import { clearLicenseRenewalTimer } from "../drm/license";
import { FocalAudioElement, getAudioElement } from "../helpers/dom";
import { createHlsInstance, FocalHls } from "../helpers/hls-instance";
import { getAudioEffectController } from "../playback/audio-effects.js";
import { MusicKitInstance } from "./instance";

export interface QueueItemParam {
    song: string;
}

export class QueueItem  {
    song: string;
    hasInitialized: boolean = false;
    hls: FocalHls | null = null;
    audio: FocalAudioElement;
    parent: MusicKitInstance;
    
    // Bound event handler for proper cleanup
    private boundHandleEnded: () => void;

    constructor(param: QueueItemParam, parent: MusicKitInstance) {
        this.song = param.song;
        this.parent = parent;
        
        // Pre-bind the event handler so we can remove it later
        this.boundHandleEnded = this.handleEnded.bind(this);

        this.audio = document.createElement('audio');
        this.audio.className = `focalmk-audio-${this.song}`;
        this.audio.setAttribute('data-focalmk-id', this.song);
        document.body.appendChild(this.audio);
    }

    handleEnded() {
        this.parent.handleSongEnded();
    }

    setActive() {
        console.log(`[FocalMK] Initializing HLS for song: ${this.song}`);
        this.hls = createHlsInstance(this.audio);
        this.audio.attachedHls = this.hls;

        // Find the previous audio element and remove it from being the main one
        getAudioElement().removeAttribute("id");

        // Set the current audio element to the main one
        this.audio.id = "apple-music-player";
        this.audio.addEventListener('ended', this.boundHandleEnded);
    }

    setInactive() {
        console.log(`[FocalMK] Deactivating song: ${this.song}`);
        this.audio.removeEventListener('ended', this.boundHandleEnded);
        this.audio.src = "";
        this.audio.load();
        this.audio.removeAttribute("id");
        setTimeout(() => this.dispose(), 5000); // Delay disposal to allow any pending operations to complete
    }

    dispose() {
        // Clear any license renewal timers before destroying HLS
        if (this.hls) {
            clearLicenseRenewalTimer(this.hls);
            
            // Close the media key session if it exists
            if (this.hls.mediaKeySession) {
                this.hls.mediaKeySession.close().catch(() => {});
            }
        }
        
        getAudioEffectController(this.audio)?.dispose?.();
        this.audio?.remove();
        this.hls && (this.hls.mediaToAttach = undefined);
        this.hls?.destroy();
        this.hls = null;
        this.audio = null!
        this.hasInitialized = false;

        // Tell the client that Atmos is no longer available
        if (window.igniteView) {
            window.igniteView.commandBridge.setPlayerCallbackData(`atmos-state-${this.song}`, "");
        }

        console.log(`[FocalMK] Disposed resources for song: ${this.song}`);
    }
}