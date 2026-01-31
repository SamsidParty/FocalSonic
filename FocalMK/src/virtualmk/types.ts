import { clearLicenseRenewalTimer, tryAcquireLicense } from "../drm/license";
import { FocalAudioElement, getAudioElement } from "../helpers/dom";
import { createHlsInstance, FocalHls } from "../helpers/hls-instance";
import { loadContent } from "../interface/low-level";
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

    enableTransitionLock() {
        // Locks the audio element to prevent interruptions during transitions
        this.audio.setAttribute("data-focalmk-transition-lock", "true");
    }

    disableTransitionLock() {
        this.audio.removeAttribute("data-focalmk-transition-lock");
    }

    handleEnded() {
        this.parent.handleSongEnded();
    }

    ensureHLS() {
        if (this.hls) return;

        console.log(`[FocalMK] Initializing HLS for song: ${this.song}`);
        this.hls = createHlsInstance(this.audio);
        this.audio.attachedHls = this.hls;

        // Mount the audio effects controller
        // Do this now so that it loads the impulse response (otherwise you get an annoying clicking sound after it loads)
        getAudioEffectController(this.audio);
    }

    async prepareForPlayback() {    
        this.ensureHLS();

        if (!this.hasInitialized && this.hls) {
            this.hasInitialized = true;
            await loadContent(this.hls, this.song);
        }
        else if (this.hls?.licenseExpired) {
            await tryAcquireLicense(this.hls);
        }   
    }

    setActive() {
        this.ensureHLS();

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