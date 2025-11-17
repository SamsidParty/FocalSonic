import type { MediaSourceData } from "./control-interface";

export default interface PlaybackInterface {
    setSource(initialMediaSource: MediaSourceData): Promise<void>;
}