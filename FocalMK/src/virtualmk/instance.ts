import { getAudioElement } from "../helpers/dom";
import { getAudioEffectController } from "../playback/audio-effects.js";
import { QueueItem, QueueItemParam } from "./types";
import { PlaybackStates } from "./virtualmk-constants";

export class MusicKitInstance {

    // Auth
    _musicUserToken: string | null = null;
    _developerToken: string | null = null;
    
    get musicUserToken() {
        if (!this._musicUserToken) {
            this._musicUserToken = window.injectedUserToken || localStorage.getItem("applemusic_media_user_token");
        }

        return this._musicUserToken;
    }

    get developerToken() {
        if (!this._developerToken) {
            this._developerToken = window.injectedDeveloperToken || localStorage.getItem("applemusic_developer_token");
        }

        return this._developerToken;
    }

    get isAuthorized() {
        return this.musicUserToken !== null && this.developerToken !== null;
    }

    get isLocked() {
        return getAudioElement().getAttribute("data-focalmk-transition-lock") === "true";
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
        if (this.isLocked) return;

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
        await itemToPlay.prepareForPlayback();

        const audio = getAudioElement();
        audio.playbackRate = this._playbackRate;

        // Make sure the Web Audio graph is actually running before we ask the
        // media element to play. If the AudioContext is `suspended` (very common
        // when the user-gesture activation expired during license/manifest fetches
        // above) the media element is gated by Web Audio -- output is silent AND
        // currentTime never advances, which surfaces as a confusing hls.js
        // `bufferStalledError` later on.
        try {
            const ctx: AudioContext | undefined = (getAudioEffectController(audio) as any)?.audioCtx;
            if (ctx && ctx.state === "suspended") {
                await ctx.resume().catch(err => {
                    console.warn("[FocalMK] AudioContext.resume() rejected:", err);
                });
            }
        }
        catch (ctxErr) {
            console.warn("[FocalMK] Error resuming AudioContext before play():", ctxErr);
        }

        try {
            await audio.play();
        }
        catch (err) {
            // Most commonly: Chromium's autoplay policy rejected play() because the
            // user gesture activation expired while we were awaiting license/manifest
            // requests. Surface it instead of swallowing -- otherwise the audio
            // element stays paused while hls.js keeps thinking playback is healthy,
            // and the user just sees silence.
            console.error("[FocalMK] audio.play() rejected:", err);
        }
    }

    stop() {
        this.isPlaying = false;
        console.log("[FocalMK] Playback stopped");
        getAudioElement().src = "";
        this.queue[0]?.setInactive?.();
    }

    pause() {
        if (this.isLocked) return;

        this.isPlaying = false;
        console.log("[FocalMK] Playback paused");
        getAudioElement().pause();
    }

    seekToTime(time: number) {
        if (this.isLocked) return;

        try {
            getAudioElement().currentTime = time;
        }
        catch {}
    }

    setQueue(q: QueueItemParam) {
        console.log("[FocalMK] Queue set to:", q.song);
        this.queue = [new QueueItem(q, this)];
    }

    playNext(q: QueueItemParam, clearIfNeeded: boolean = false) {
        // Determine if the item is already next in the queue (if preloadNextSource was called)
        if (this.queue.length === 2 && this.queue[1]!.song === q.song) {
            console.log("[FocalMK] Using preloaded source from queue:", q.song);
            return;
        }
        else if (clearIfNeeded) {
            this.clearQueue();
        }

        console.log("[FocalMK] Added to queue:", q.song);
        this.queue.push(new QueueItem(q, this));
    }

    preloadNextSource(q: QueueItemParam) {
        console.log("[FocalMK] Preloading next source:", q.song);
        const qItem = new QueueItem(q, this);
        this.queue.push(qItem);
        qItem.prepareForPlayback();
    }

    transitionSources(nextSongID: string, fadeDuration: number = 3000) {
        console.log("[FocalMK] Transitioning sources");
        
        if (this.queue.length < 2) {
            console.warn("[FocalMK] Not enough items in queue to transition sources");
            return;
        }


        const currentSource = this.queue[0];
        const nextSource = this.queue[1];

        // Sometimes a user will queue a song just before the transition starts but after the next song is preloaded
        // In this case, abort the transition
        if (nextSource.song !== nextSongID) {
            console.warn("[FocalMK] Next song ID does not match the queued item, transition aborted");

            // Dispose the preloaded item
            nextSource.setInactive();
            this.queue.splice(1, 1);

            return;
        }

        // Create a smooth crossfade between the two audio elements
        const currentEffectCtrl = getAudioEffectController(currentSource.audio);
        const nextEffectCtrl = getAudioEffectController(nextSource.audio);

        // Prevents interruptions during the transition
        currentSource.enableTransitionLock();

        nextSource.audio.volume = 0;
        nextSource.audio.play().then(() => {
            currentEffectCtrl.adjustVolume(0, fadeDuration);
            nextEffectCtrl.adjustVolume(1, fadeDuration);
        }).catch((error) => {
            console.error("[FocalMK] Crossfade transition play() rejected:", error);
        });
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