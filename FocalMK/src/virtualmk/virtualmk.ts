import { MusicKitInstance } from "./instance";
import { PlaybackStates, PlayerRepeatMode } from "./virtualmk-constants";

export class MusicKit {
    PlayerRepeatMode: typeof PlayerRepeatMode;
    PlaybackStates: typeof PlaybackStates;

    _instance: MusicKitInstance;
    getInstance = () => this._instance;

    constructor() {

        // Define constants
        this.PlayerRepeatMode = PlayerRepeatMode;
        this.PlaybackStates = PlaybackStates;

        // Start the instance
        this._instance = new MusicKitInstance();

        console.log("[FocalMK] Virtual MusicKit initialized");
    }
}