import { startAppleMusicProxy } from "./runtime/proxy.js";


if (window.location.href.includes("music.apple.com")) {
    startAppleMusicProxy();
}