import { base64ToUint8Array } from "../helpers/base64";
import { appleMagic1, appleMagic2 } from "../helpers/constants";
import handleError from "../helpers/error-handler";


export function getWebPlaybackPssh() {
    const e = Uint8Array.from(appleMagic1);
    const n = new Uint8Array(appleMagic2);
    for (let d = 0; d < e.length; d++)
        n[n.length - 16 + d] = e[d];
    return n
}

export function getEnhancedPssh(licenseURL: string) {
    if (licenseURL.includes("base64,")) {
        const split = licenseURL.split(",");
        const base64Decoded = base64ToUint8Array(split[1]);
        return base64Decoded;
    }
    handleError("Invalid enhanced PSSH license URL", true);
}

export function getPssh(licenseURL: string) {
    if (!licenseURL) handleError("No license URL provided for PSSH generation", true);
    if (licenseURL.startsWith("enhanced/")) {
        return getEnhancedPssh(licenseURL.replace("enhanced/", ""));
    }
    console.log("[FocalMK]: Using default Web Playback PSSH " + btoa(String.fromCharCode(...getWebPlaybackPssh())));
    return getWebPlaybackPssh();
}
