import { getAudioElement } from "../helpers/dom";
import { loadContent } from "../interface/low-level";
import { QueueItem, QueueItemParam } from "./types";
import { PlaybackStates, PlayerRepeatMode } from "./virtualmk-constants";

export class MusicKitInstance {

    // Auth
    _musicUserToken: string | null = null;
    _developerToken: string | null = null;
    
    get musicUserToken() {

        if (!this._musicUserToken) {
            this._musicUserToken = localStorage.getItem("applemusic_media_user_token");
        }

        return this._musicUserToken;
    }

    get developerToken() {

        if (!this._developerToken) {
            this._developerToken = localStorage.getItem("applemusic_developer_token");
        }

        return this._developerToken;
    }

    get isAuthorized() {
        return this.musicUserToken !== null && this.developerToken !== null;
    }

    // Playback
    _repeatMode: number = 0;
    _playbackRate: number = 1;
    isPlaying: boolean = false;
    nowPlayingItem: string | null = null;

    // Events
    eventListeners: { [key: string]: ((args: any) => void)[] } = {};

    fireEvent(event: string, args: any) {
        const listeners = this.eventListeners[event];
        if (listeners) {
            listeners.forEach(callback => {
                callback(args);
            });
        }
    }

    handleSongEnded() {
        if (this.repeatMode === PlayerRepeatMode.one && this.queue[0]) {
            // Redo of playback
            // Insert a new queue item just after the current one
            const newItem = new QueueItem({ song: this.queue[0]!.song }, this);
            this.queue.splice(1, 0, newItem);
            this.skipToNextItem();
            return;
        }

        this.fireEvent("playbackStateDidChange", { oldState: PlaybackStates.playing, state: PlaybackStates.ended });
    }

    // Queue
    queue: QueueItem[] = [];

    get repeatMode() {
        return this._repeatMode;
    }
    set repeatMode(mode: number) {
        this._repeatMode = mode;
    }

    get currentPlaybackDuration() {
        return getAudioElement().duration || 0;
    }
    
    get playbackRate() {
        return this._playbackRate;
    }
    set playbackRate(rate: number) {
        this._playbackRate = rate;
        getAudioElement().playbackRate = rate;
    }

    async play() {
        this.isPlaying = true;
        console.log("[FocalMK] Playback request started");

        if (this.queue.length < 1) {
            console.warn("[FocalMK] No items in queue to play");
            return;
        }

        // Get the first item in the queue
        const itemToPlay = this.queue[0]!;
        this.nowPlayingItem = itemToPlay.song;
        console.log(`[FocalMK] Now playing: ${itemToPlay.song}`);

        itemToPlay.setActive();
        if (!itemToPlay.hasInitialized && itemToPlay.hls) {
            itemToPlay.hasInitialized = true;
            await loadContent(itemToPlay.hls, itemToPlay.song);
        }

        getAudioElement().playbackRate = this._playbackRate;
        getAudioElement().play();
    }

    stop() {
        this.isPlaying = false;
        console.log("[FocalMK] Playback stopped");
        getAudioElement().src = "";
        this.queue[0]?.setInactive?.();
    }

    pause() {
        this.isPlaying = false;
        console.log("[FocalMK] Playback paused");
        getAudioElement().pause();
    }

    seekToTime(time: number) {
        try {
            getAudioElement().currentTime = time;
        }
        catch {}
    }

    setQueue(q: QueueItemParam) {
        console.log("[FocalMK] Queue set to:", q.song);
        this.queue = [new QueueItem(q, this)];
    }

    playNext(q: QueueItemParam) {
        console.log("[FocalMK] Added to queue:", q.song);
        this.queue.push(new QueueItem(q, this));
    }

    skipToNextItem() {
        console.log("[FocalMK] Skipping to next item in queue");

        if (this.queue[0]?.hasInitialized) {
            this.queue[0]?.setInactive();
        }

        if (this.queue.length > 1) { this.queue.shift(); }
        this.play();
    }

    clearQueue() {
        console.log("[FocalMK] Clearing queue");

        this.queue.forEach(item => {
            item?.hasInitialized && item.setInactive();
        });

        this.queue = [];
    }

    addEventListener(event: string, callback: (args: any) => void) {
        this.eventListeners[event] = this.eventListeners[event] || [];
        this.eventListeners[event].push(callback);
    }


}