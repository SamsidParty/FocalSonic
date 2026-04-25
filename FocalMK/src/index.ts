import { startAppleMusicProxy } from "./runtime/proxy.js";
import { startTokenGrabber } from "./runtime/token-grabber.js";
import { MusicKit } from "./virtualmk/virtualmk.js";

declare global {
    interface Window {
        virtualMusicKit?: MusicKit;
        injectedQueue?: any[];
        injectedDeveloperToken?: string;
        injectedUserToken?: string;
    }
}


if (window.location.href.includes("music.apple.com")) {
    startTokenGrabber();
}
else if (window.location.href.includes("proxy.html")) {
    window.virtualMusicKit = new MusicKit();
    if (!window.injectedQueue) { window.injectedQueue = []; }

    startAppleMusicProxy();
}

