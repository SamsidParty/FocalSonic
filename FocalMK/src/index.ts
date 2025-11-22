import { isIgniteView } from "./helpers/igniteview.js";
import { startAppleMusicProxy } from "./runtime/proxy.js";
import { MusicKit } from "./virtualmk/virtualmk.js";

declare global {
    interface Window {
        virtualMusicKit?: MusicKit;
    }
}

const enableVirtualMK = true;
if (isIgniteView() && enableVirtualMK) {
    // Setup virtual MusicKit
    window.virtualMusicKit = new MusicKit();
}

if (window.location.href.includes("music.apple.com") || window.location.href.includes("proxy.html")) {
    startAppleMusicProxy();
}