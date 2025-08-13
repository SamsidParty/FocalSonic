import { logger } from "@/utils/logger";
import { checkServerType } from "@/utils/servers";
import { AudioPlayerProps } from "./audio";



class NativeVirtualAudioPlayer {
    duration = NaN;
    _volume = 1;
    _currentTime = 0;
    _currentTimeOffset = Date.now();
    _loop: boolean = false;
    _src?: string;
    _state = "idle";
    id?: string;
    paused: boolean = true;

    initialize() {
        if (this._state === "created" || this._state === "creating") return;
        this._state = "creating";
        setTimeout(async () => {
            this.id = (checkServerType().isAppleMusic) ? "appleMusicPlayer" : "defaultPlayer";
            logger.info("NativeVirtualAudioPlayer created with id:", this.id);
      
            window["handleAudioEvent_" + this.id] = (e: string, param: any) => {
                if (e == "ended") {
                    this.onEnded?.();
                }
                else if (e == "loaded") {
                    this.duration = param;
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
            };

            await igniteView.commandBridge.createAudioPlayer(this.id);
            this._state = "created";
            this.onLoadStart?.();
        }, 0);
    }

    // "this" is undefined in the dispose function, so we pass it as an argument
    dispose(self) {
        if (self._state !== "created") return;
        self._state = "disposed";
        self._src = undefined;
        logger.info("NativeVirtualAudioPlayer disposed with id:", self.id);
        igniteView.commandBridge.disposeAudioPlayer(self.id!);
    }

    get src() {
        return this._src;
    }

    set src(value: string | undefined) {
        this._src = value;
        this._src && this.initialize();
    }

    get currentTime() {
        if (this.paused || this._currentTimeOffset < 1) { return this._currentTime; }
        return Math.min(((Date.now() - this._currentTimeOffset) / 1000) + this._currentTime, this._currentTime + 1);
    }
  
    set currentTime(value: number) {
        this.seek(value);
    }

    get loop() {
        return this._loop;
    }

    set loop(value: boolean) {
        this._loop = value;
        setTimeout(async () => {
            await this.waitForCreation();
            igniteView.commandBridge.setAudioPlayerLoopMode(this.id!, this._loop);
        }, 0);
    }

    get volume() {
        return this._volume;
    }

    set volume(value: number) {
        this._volume = value;
        setTimeout(async () => {
            await this.waitForCreation();
            igniteView.commandBridge.setAudioPlayerVolume(this.id!, this._volume);
        }, 0);
    }

    async waitForCreation() {
        while (this._state !== "created") {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    async applySource() {
        await this.waitForCreation();
        await igniteView.commandBridge.setAudioPlayerSource(this.id!, this._src);
    }

    async play() {
        this.paused = false;
        await this.waitForCreation();
        if (!this.src) { return; }
        await this.applySource();
        await igniteView.commandBridge.playAudio(this.id!);
        this.onPlay?.();
    }

    async pause() {
        this.paused = true;
        this._currentTimeOffset = 0;
        await this.waitForCreation();
        await igniteView.commandBridge.pauseAudio(this.id!);
        this.onPause?.();
    }

    async seek(time: number) {
        if (Math.abs(this._currentTime - time) < 1) return;
        this._currentTime = time;
        this._currentTimeOffset = Date.now();
        await this.waitForCreation();
        await igniteView.commandBridge.seekAudio(this.id!, time);
        this.onTimeUpdate?.();
    }
  
}

const virtualPlayer = new NativeVirtualAudioPlayer();

export function NativeAudioPlayer({ audioRef, onError, ...props }: AudioPlayerProps) {
    Object.keys(props).forEach(k => virtualPlayer[k] = props[k]);
    audioRef.current = virtualPlayer;

    return (<></>);
}