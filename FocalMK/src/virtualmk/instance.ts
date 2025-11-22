import { getAudioElement } from "../helpers/dom";
import { loadContent } from "../interface/low-level";
import { QueueItem } from "./types";

export class MusicKitInstance {

    // Auth
    musicUserToken: string | null = "ArtrW+GDMTxB5jIO2G1yBU1NqGdY4hqxDIZdnY17Knmg6Q0q2POjahUroexArY5nWdC0vviL8cS9dntXsvoP2G+JwCSMW/tjZRwrq1iF39TSDFfBi3lcklcGm/6s+LeAIBvICW1EaffwqrPhSGpEZQqR6jX/4sEhUxFstfMQ7bxNV03I1Lue4fKtUrfDftaxa8t025i6JXx3FQuh8naAklYXfUl7FoNRWdEGbnjFFPdYdQKYrg==";
    developerToken: string | null = "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IldlYlBsYXlLaWQifQ.eyJpc3MiOiJBTVBXZWJQbGF5IiwiaWF0IjoxNzYxNjE4NTU1LCJleHAiOjE3Njg4NzYxNTUsInJvb3RfaHR0cHNfb3JpZ2luIjpbImFwcGxlLmNvbSJdfQ.Rag4lLqQl7vEi8FuEM7SsCW_lRzcndEobrdaFwN45O3G4ATnLchGSH2022CY-P-AccC-qlflcCukP_133uuMYA";
    
    get isAuthorized() {
        return this.musicUserToken !== null && this.developerToken !== null;
    }

    // Playback
    repeatMode: number = 0;
    isPlaying: boolean = false;
    nowPlayingItem: string | null = null;

    // Queue
    queue: QueueItem[] = [];

    get currentPlaybackDuration() {
        return getAudioElement().duration || 0;
    }
    
    get playbackRate() {
        return getAudioElement().playbackRate;
    }
    set playbackRate(rate: number) {
        getAudioElement().playbackRate = rate;
    }

    async play() {
        this.isPlaying = true;
        console.log("[FocalMK] Playback started");

        if (this.queue.length < 1) {
            console.warn("[FocalMK] No items in queue to play");
            return;
        }

        // Get the first item in the queue
        const itemToPlay = this.queue[0]!;
        this.nowPlayingItem = itemToPlay.song;
        console.log(`[FocalMK] Now playing: ${itemToPlay.song}`);

        if (!itemToPlay.hasInitialized) {
            itemToPlay.hasInitialized = true;
            await loadContent(itemToPlay.song);
        }
        getAudioElement().play();
    }

    stop() {
        this.isPlaying = false;
        console.log("[FocalMK] Playback stopped");
        getAudioElement().src = "";
    }

    pause() {
        this.isPlaying = false;
        console.log("[FocalMK] Playback paused");
        getAudioElement().pause();
    }

    setQueue(q: QueueItem) {
        console.log("[FocalMK] Queue set to:", q.song);
        this.queue = [q];
    }

    playNext(q: QueueItem) {
        console.log("[FocalMK] Added to queue:", q.song);
        this.queue.push(q);
    }

    skipToNextItem() {
        console.log("[FocalMK] Skipping to next item in queue");
        if (this.queue.length > 1) { this.queue.shift(); }
        this.play();
    }

    clearQueue() {
        console.log("[FocalMK] Clearing queue");
        this.queue = [];
    }

    addEventListener(event: string, callback: (args: any) => void) {
        // Dummy implementation
        console.log(`[FocalMK] Event listener added for ${event}`);
    }


}