import { isSharedStoreReady, onSharedStoreReady } from "@/store/shared.store";
import { logger } from "@/utils/logger";
import { checkServerType } from "@/utils/servers";
import { useEffect } from "react";
import { AudioPlayerProps } from "./audio";

interface HostParameters {
    volume: number
    playbackRate: number
    filterData: string
    loop: boolean
}

const hostParameterCommands: Record<keyof HostParameters, string> = {
    volume: "setAudioPlayerVolume",
    playbackRate: "setAudioPlayerSpeed",
    filterData: "setAudioPlayerFilterData",
    loop: "setAudioPlayerLoopMode",
};

// Derived from shared_store, which hydrates asynchronously. Sending them earlier would push
// its defaults (full volume, no effects) over the values the host player was created with.
const sharedStoreParameters = new Set<keyof HostParameters>(["volume", "playbackRate", "filterData"]);

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

    // What the app asked for, and what the current host player has actually been sent.
    // Comparing against "sent" rather than our own last value means a host player that is
    // new (window reopened, player recreated) or was changed behind our back still gets
    // everything, even values that happen to equal our defaults.
    private desired: Partial<HostParameters> = {};
    private sent: Partial<HostParameters> = {};
    private flushScheduled = false;

    // play() and pause() go out strictly in order. play() awaits a round trip before it
    // sends playAudio, so a pause() issued meanwhile used to land first and get undone.
    private commandChain: Promise<void> = Promise.resolve();

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

            // The host player may predate this page (it outlives the window) or be brand
            // new; either way it hasn't been sent anything by us yet.
            this.sent = {};
            this.flushParameters();

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
        self.sent = {};
        logger.info("NativeVirtualAudioPlayer disposed with id:", self.id);
        window.igniteView?.commandBridge.disposeAudioPlayer(self.id!);
    }

    private setParameter<K extends keyof HostParameters>(key: K, value: HostParameters[K]) {
        this.desired[key] = value;
        this.scheduleFlush();
    }

    scheduleFlush() {
        if (this.flushScheduled) return;
        this.flushScheduled = true;

        setTimeout(() => {
            this.flushScheduled = false;
            this.flushParameters();
        }, 0);
    }

    /** Sends whatever the host player doesn't have yet. Waits for the host player to exist. */
    private flushParameters() {
        if (this._state !== "created" || !this.id) return;

        const bridge = window.igniteView?.commandBridge;
        if (!bridge) return;

        (Object.keys(this.desired) as (keyof HostParameters)[]).forEach((key) => {
            const value = this.desired[key];
            if (value === undefined || this.sent[key] === value) return;
            if (sharedStoreParameters.has(key) && !isSharedStoreReady()) return;

            this.sent[key] = value as never;
            bridge[hostParameterCommands[key]]?.(this.id!, value);
        });
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
        this._loop = value;
        this.setParameter("loop", value);
    }

    get filterData() {
        return this._filterData;
    }

    set filterData(value: string) {
        this._filterData = value;
        this.setParameter("filterData", value);
    }

    get volume() {
        return this._volume;
    }

    set volume(value: number) {
        this._volume = value;
        this.setParameter("volume", value);
    }

    set playbackRate(value: number) {
        if (!(value > 0)) {
            value = 1;
        }
        this._playbackRate = value;
        this.setParameter("playbackRate", value);
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

    private enqueue(task: () => Promise<void>): Promise<void> {
        const run = this.commandChain.then(task);
        this.commandChain = run.catch(() => undefined);
        return run;
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

        return this.enqueue(async () => {
            // Paused again before this ran; that pause is queued behind us and reports it.
            if (this.paused || !this.src) return;

            await this.waitForCreation();
            await this.applySource();
            if (this.paused) return;

            await window.igniteView?.commandBridge.playAudio(this.id!);
            this.onPlay?.();
        });
    }

    async pause() {
        this.paused = true;
        this._currentTimeOffset = 0;

        return this.enqueue(async () => {
            // Superseded by a later play(), which is queued behind us.
            if (!this.paused) return;

            // Nothing to pause if the host player was never created.
            if (this._state !== "created") { this.onPause?.(); return; }

            await window.igniteView?.commandBridge.pauseAudio(this.id!);
            this.onPause?.();
        });
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

// Volume, speed and effects set before shared_store hydrated were held back; send them now.
onSharedStoreReady(() => virtualPlayer.scheduleFlush());

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
