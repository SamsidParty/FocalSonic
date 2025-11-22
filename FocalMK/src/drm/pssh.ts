import { appleMagic1, appleMagic2 } from "../helpers/constants";


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
        const base64Decoded = Uint8Array.fromBase64(split[1]);
        return base64Decoded;
    }
    throw new Error("Invalid enhanced PSSH license URL");
}

export function getPssh(licenseURL: string) {
    if (!licenseURL) throw new Error("No license URL provided for PSSH generation");
    if (licenseURL.startsWith("enhanced/")) {
        return getEnhancedPssh(licenseURL.replace("enhanced/", ""));
    }
    return getWebPlaybackPssh();
}
