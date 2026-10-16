import { logger } from "@/utils/logger";
import { checkServerType } from "@/utils/servers";
import { useEffect } from "react";
import { AudioPlayerProps } from "./audio";



class NativeVirtualAudioPlayer {
    duration = NaN;
    _volume = 1;
    _playbackRate = 1;
    _filterData = "";
    _currentTime = 0;
    _currentTimeOffset = Date.now();
    _loop: boolean = false;
    _src?: string;
    _state = "idle";
    _creation: Promise<void> | null = null;
    id?: string;
    paused: boolean = true;
    volumeTimeout: ReturnType<typeof setTimeout> | undefined;

    // Assigned from the <AudioPlayer> props below.
    onEnded?: () => void;
    onLoadedMetadata?: () => void;
    onLoadedData?: () => void;
    onTimeUpdate?: () => void;
    onLoadStart?: () => void;
    onPlay?: () => void;
    onPause?: () => void;

    initialize(): Promise<void> {
        if (this._state === "created") return Promise.resolve();
        if (this._state === "creating" && this._creation) return this._creation;

        this._state = "creating";
        this._creation = this.createOnHost();
        this._creation.catch(() => undefined);

        return this._creation;
    }

    private async createOnHost(): Promise<void> {
        await new Promise((resolve) => setTimeout(resolve, 0));

        try {
            this.id = (checkServerType().isAppleMusic) ? "appleMusicPlayer" : "defaultPlayer";
            logger.info("NativeVirtualAudioPlayer created with id:", this.id);
      
            window["handleAudioEvent_" + this.id] = (e: string, param: any) => {
                if (e == "ended") {
                    this.onEnded?.();
                }
                else if (e == "loaded") {
                    this.duration = param;
                    this._currentTime = 0;
                    this.onLoadedMetadata?.();
                    this.onLoadedData?.();
                    this.onTimeUpdate?.();
                }
                else if (e == "timeupdate") {
                    if (this._currentTime != param) {
                        this._currentTime = param;
                        this._currentTimeOffset = Date.now();
                        this.onTimeUpdate?.();
                    }
                }
                else if (e == "durationupdate") {
                    if (this.duration != param) {
                        this.duration = param;
                        this.onLoadedMetadata?.();
                    }
                }
            };

            await window.igniteView?.commandBridge.createAudioPlayer(this.id);
            this._state = "created";
            this.onLoadStart?.();
        }
        catch (error) {
            // Must stay creatable: a throw used to pin _state at "creating" forever,
            // and waitForCreation() then spun on a condition that never came true.
            logger.error("NativeVirtualAudioPlayer creation failed", error);
            this._state = "idle";
            this._creation = null;
            throw error;
        }
    }

    // "this" is undefined in the dispose function, so we pass it as an argument
    dispose(self) {
        if (self._state !== "created") return;
        self._state = "disposed";
        self._src = undefined;
        logger.info("NativeVirtualAudioPlayer disposed with id:", self.id);
        window.igniteView?.commandBridge.disposeAudioPlayer(self.id!);
    }

    get src() {
        return this._src;
    }

    set src(value: string | undefined) {
        if (this._src !== value) {
            this._currentTime = 0;
            this._currentTimeOffset = Date.now();
            this.duration = 0;
            this.onTimeUpdate?.();
            this.onLoadedMetadata?.();
        }
        this._src = value;
        this._src && this.initialize();
    }

    get currentTime() {
        if (this.readyState === 0) { return 0; }
        if (this.paused || this._currentTimeOffset < 1) { return this._currentTime; }
        return Math.min((((Date.now() - this._currentTimeOffset) / 1000) * this._playbackRate) + this._currentTime, this._currentTime + this._playbackRate);
    }
  
    set currentTime(value: number) {
        this.seek(value);
    }

    get loop() {
        return this._loop;
    }

    set loop(value: boolean) {
        if (this._loop === value) return;
        this._loop = value;
        setTimeout(async () => {
            await this.waitForCreation();
            window.igniteView?.commandBridge.setAudioPlayerLoopMode(this.id!, this._loop);
        }, 0);
    }

    get filterData() {
        return this._filterData;
    }

    set filterData(value: string) {
        if (this._filterData === value) return;
        this._filterData = value;
        setTimeout(async () => {
            await this.waitForCreation();
            window.igniteView?.commandBridge.setAudioPlayerFilterData(this.id!, this._filterData);
        }, 0);
    }

    get volume() {
        return this._volume;
    }

    set volume(value: number) {
        if (this._volume === value) return;
        this._volume = value;

        clearTimeout(this.volumeTimeout);
        this.volumeTimeout = setTimeout(async () => {
            await this.waitForCreation();
            window.igniteView?.commandBridge.setAudioPlayerVolume(this.id!, this._volume);
        }, 0);
    }

    set playbackRate(value: number) {
        if (this._playbackRate === value) return;
        
        if (value <= 0) {
            value = 1;
        }
        this._playbackRate = value;

        setTimeout(async () => {
            await this.waitForCreation();
            window.igniteView?.commandBridge.setAudioPlayerSpeed(this.id!, this._playbackRate);
        }, 0);
    }

    get playbackRate() {
        return this._playbackRate;
    }

    get readyState() {
        
        if (!this.paused && (this._state !== "created" || this._currentTime === 0 || !this.duration)) {
            return 0;
        }

        return 4;
    }

    async waitForCreation() {
        if (this._state === "created") return;

        // "idle" and "disposed" used to spin here forever; drive creation instead.
        if (this._state !== "creating" || !this._creation) {
            await this.initialize();
            return;
        }

        await this._creation;
    }

    async applySource() {
        await this.waitForCreation();
        await window.igniteView?.commandBridge.setAudioPlayerSource(this.id!, this._src);
    }

    async load() {
        await this.applySource();
    }

    async play() {
        // Staying paused matters: readyState reports 0 for an unpaused player with no
        // position, which pins the progress bar in its blinking "loading" state.
        if (!this.src) { this.paused = true; return; }

        this.paused = false;
        await this.waitForCreation();
        await this.applySource();
        await window.igniteView?.commandBridge.playAudio(this.id!);
        this.onPlay?.();
    }

    async pause() {
        this.paused = true;
        this._currentTimeOffset = 0;

        // Nothing to pause if the host player was never created.
        if (this._state !== "created") { this.onPause?.(); return; }

        await window.igniteView?.commandBridge.pauseAudio(this.id!);
        this.onPause?.();
    }

    async seek(time: number) {
        if (this.readyState === 0) { return; }
        if (Math.abs(this._currentTime - time) < 1) return;
        this._currentTime = time;
        this._currentTimeOffset = Date.now();
        await this.waitForCreation();
        await window.igniteView?.commandBridge.seekAudio(this.id!, time);
        this.onTimeUpdate?.();
    }
  
}

const virtualPlayer = new NativeVirtualAudioPlayer();

export function NativeAudioPlayer({ audioRef, onError, ...props }: AudioPlayerProps) {
    audioRef.current = virtualPlayer;

    // In an effect, not in render: assigning src fires handlers that write to the
    // player store, and doing that mid-render tears the tree being built.
    // src goes last so the setter sees this render's callbacks, not the last one's.
    useEffect(() => {
        const { src, ...rest } = props as typeof props & { src?: string };

        Object.keys(rest).forEach((key) => { virtualPlayer[key] = rest[key]; });

        if (src !== undefined) { virtualPlayer.src = src; }
    });

    return (<></>);
}