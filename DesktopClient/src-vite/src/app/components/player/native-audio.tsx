import { useState } from "react";
import { AudioPlayerProps } from "./audio";


class NativeVirtualAudioPlayer {
  volume = 0;
  src?: string;
  isCreated = false;
  id?: string;

  constructor() {
    setTimeout(async () => {
      this.id = crypto.randomUUID();
      await igniteView.commandBridge.createAudioPlayer(this.id);
      this.isCreated = true;
    }, 0);
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
    await this.waitForCreation();
    if (!this.src) { return; }
    await this.applySource();
    await igniteView.commandBridge.playAudio(this.id!);
  }

  async pause() {
    await this.waitForCreation();
    await igniteView.commandBridge.pauseAudio(this.id!);
  }
  
}

export function NativeAudioPlayer({ audioRef, onError, ...props }: AudioPlayerProps) {
  const [virtualPlayer, setVirtualPlayer] = useState<NativeVirtualAudioPlayer | null>(new NativeVirtualAudioPlayer());
  audioRef.current = virtualPlayer;
  Object.keys(props).forEach(k => virtualPlayer[k] = props[k]);
  console.log(props);
  return (<></>)
}