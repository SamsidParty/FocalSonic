import { base64ToUint8Array, uint8ArrayToBase64 } from "../helpers/base64";
import { appleMagic1, appleMagic2 } from "../helpers/constants";
import handleError from "../helpers/error-handler";

/**
 * Extract the 16-byte content key ID from an EXT-X-KEY URI of the form
 * `data:[mime];base64,<base64>`. For Apple's regular (non-enhanced) web playback
 * streams the payload is the raw 16-byte key ID.
 */
function extractKeyIdFromDataUri(licenseURL: string): Uint8Array | null {
    if (!licenseURL || !licenseURL.includes("base64,")) return null;
    try {
        const base64 = licenseURL.split("base64,")[1];
        const bytes = base64ToUint8Array(base64);
        // A bare key ID is exactly 16 bytes. Anything else (e.g. a full PSSH box)
        // is handled by the enhanced path.
        if (bytes.length === 16) return bytes;
        return null;
    }
    catch {
        return null;
    }
}

/**
 * Build a Widevine PSSH box for Apple Music web playback.
 *
 * Apple used to serve a single constant key ID for every web-playback track, so
 * the original implementation just baked a hardcoded key ID into the PSSH
 * template. Around mid-2026 Apple started issuing per-track key IDs that match
 * the `tenc` box inside each fMP4 init segment, which made the constant key ID
 * mismatch the segment (CDM holds key A, MSE wants key B -> silent stall at
 * 0:00 and an "Init segment with encrypted track with has no key" warning from
 * hls.js's passthrough remuxer).
 *
 * If `licenseURL` is the manifest's EXT-X-KEY data URI we can pull the real key
 * ID out of it and patch it into the PSSH so the CDM's stored key matches what
 * MSE actually asks for.
 */
export function getWebPlaybackPssh(licenseURL?: string) {
    const n = new Uint8Array(appleMagic2);

    const realKeyId = licenseURL ? extractKeyIdFromDataUri(licenseURL) : null;
    if (realKeyId) {
        // The last 16 bytes of the Widevine PSSH data are the key ID slot.
        n.set(realKeyId, n.length - 16);
        return n;
    }

    // Legacy fallback: use the historical hardcoded key ID. Kept so old content
    // (and any caller that doesn't pass a license URL) still works.
    const e = Uint8Array.from(appleMagic1);
    for (let d = 0; d < e.length && (n.length - 16 + d) < n.length; d++)
        n[n.length - 16 + d] = e[d];
    return n;
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
    const pssh = getWebPlaybackPssh(licenseURL);
    console.log("[FocalMK]: Using Web Playback PSSH " + uint8ArrayToBase64(pssh));
    return pssh;
}
