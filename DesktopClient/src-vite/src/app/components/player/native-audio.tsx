import { AudioPlayerProps } from "./audio";



class NativeVirtualAudioPlayer {
  volume = 0;
  duration = NaN;
  _currentTime = 0;
  _currentTimeOffset = Date.now();
  _loop: boolean = false;
  src?: string;
  isCreated = false;
  id?: string;
  paused: boolean = true;

  constructor() {
    setTimeout(async () => {
      this.id = "defaultPlayer";
      
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
          this._currentTime = param;
          this._currentTimeOffset = Date.now();
          this.onTimeUpdate?.();
        }
      }

      await igniteView.commandBridge.createAudioPlayer(this.id);
      this.isCreated = true;
      this.onLoadStart?.();
    }, 0);
  }

  get currentTime() {
    if (this.paused || this._currentTimeOffset < 1) { return this._currentTime; }
    return ((Date.now() - this._currentTimeOffset) / 1000) + this._currentTime;
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

  set currentTime(value: number) {
    this.seek(value);
  }

  async waitForCreation() {
    while (!this.isCreated) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  async applySource() {
    await this.waitForCreation();
    await igniteView.commandBridge.setAudioPlayerSource(this.id!, this.src);
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
    if (this._currentTime === time) return;
    await this.waitForCreation();
    this._currentTime = time;
    this._currentTimeOffset = Date.now();
    await igniteView.commandBridge.seekAudio(this.id!, time + 0.0000001); // Adding a small offset to avoid C# thinking its an Int64
    this.onTimeUpdate?.();
  }
  
}

const virtualPlayer = new NativeVirtualAudioPlayer();

export function NativeAudioPlayer({ audioRef, onError, ...props }: AudioPlayerProps) {
  Object.keys(props).forEach(k => virtualPlayer[k] = props[k]);
  audioRef.current = virtualPlayer;

  return (<></>)
}