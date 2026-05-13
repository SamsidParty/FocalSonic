import { tryAcquireLicense } from "../drm/license";
import handleError from "../helpers/error-handler";
import Hls from "../playback/hls.js";
import { isAtmosEnabled } from "./atmos";
import { base64ToUint8Array, uint8ArrayToBase64 } from "./base64";
import { getAudioElement } from "./dom";
import { PlaybackSource } from "./sources";



export interface FocalHls extends Hls {
    contentID?: string;
    magicDataURI?: string;
    licenseAcquired?: boolean;
    licenseExpired?: boolean;  
    dolbyAtmosAvailable?: boolean;
    useDesirableAsset?: boolean;
    playbackSource: PlaybackSource;
    mediaToAttach?: HTMLAudioElement;
    mediaKeySession?: MediaKeySession;
    mediaKeys?: MediaKeys;
}

export function createHlsInstance(audio: HTMLAudioElement): FocalHls {
    const instance = new Hls({
        debug: false,
        emeEnabled: false, // Custom DRM implementation, turn off the default one
        drmSystemOptions: {},
        xhrSetup: (xhr: XMLHttpRequest, url: string) => {
            if (isAtmosEnabled() && window.igniteView && instance.dolbyAtmosAvailable && url.includes(".mp4")) { 

                // Find the atmos key ID in the magic data URI
                const magicDataURI = instance.magicDataURI || "";
                const base64Data = magicDataURI.split("base64,")[1] || "";
                const binaryData = base64ToUint8Array(base64Data);
                const keyID = binaryData.slice(34, 34 + 16); // Key ID is located at byte offset 34, length 16 bytes
                console.log("Atmos Key ID:", uint8ArrayToBase64(keyID));

                // Forward to the proxy that will edit the key IDs before it reaches the client
                const newUrl = window.igniteView.resolverURL + "/streaming-atmos-v1?" + encodeURIComponent(url);
                xhr.open("GET", newUrl, true);
                xhr.setRequestHeader("x-atmos-keyid", uint8ArrayToBase64(keyID));
            }
        }
    }) as FocalHls;

    instance.mediaToAttach = audio;

    instance.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        console.log("MANIFEST_PARSED event received, available levels:", data.levels);
        data.levels.forEach((level, id) => {
            if (level?.audioCodec?.includes("ec-3") && level?._audioGroups.includes("audio-atmos-2768")) {
                console.log("Selecting Dolby Atmos audio level:", level);
                instance.startLevel = id;
                instance.currentLevel = id;
                instance.nextAutoLevel = id;
                instance.nextLoadLevel = id;
                instance.loadLevel = id;
            }
        });
    });

    instance.on(Hls.Events.MANIFEST_LOADED, (event, data) => {
        console.log("MANIFEST_LOADED event received, available data:", data);
        const manifestText = data.networkDetails?.responseText || "";

        // We need to find the magic data URI from the manifest
        // The target line is in the format: #EXT-X-KEY:METHOD=ISO-23001-7,URI="data:;base64,AAAAAGQXwFcAHWcYFC6aTw=="
        // The format is flexible according to HLS spec, so we use a regex to find it
        const regex = /#EXT-X-KEY:.*URI="(data:;base64,[^"]+)"/;
        const match = manifestText.match(regex);
        if (match && match[1]) {
            const magicDataURI = match[1];
            console.log("Found magic data URI:", magicDataURI);
            instance.magicDataURI = magicDataURI;
        }
        else {
            // If that didn't work, that means the magic data URI is likely present in the enhancedHls format
            // There are 2 modes, one that uses com.apple.hls.AudioSessionKeyInfo and one that uses EXT-X-SESSION-KEY

            // Try mode 1
            if (data?.sessionData?.["com.apple.hls.AudioSessionKeyInfo"]) {
                const sessionKeyInfo = data.sessionData["com.apple.hls.AudioSessionKeyInfo"];
                const sessionKeyData = JSON.parse(atob(sessionKeyInfo?.VALUE || ""));
                Object.entries(sessionKeyData).forEach((keyInfo: any) => {
                    if (keyInfo[0] != "1" && keyInfo && keyInfo[1]["urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed"]) {
                        focalHls.magicDataURI = "enhanced/" + keyInfo[1]["urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed"]?.URI;
                        console.log("Found magic data URI (enhancedHls):", instance.magicDataURI);
                        instance.dolbyAtmosAvailable = true;
                    }
                });
            }

            // If that still didn't work, mode 2 will be called when the level is loaded
        }

        tryAcquireLicense(instance);
    });

    instance.on(Hls.Events.LEVEL_LOADED, (event, data) => {

        const manifestText = data.networkDetails?.responseText || "";

        console.log("LEVEL_LOADED event received", data);
        if (!instance.magicDataURI && isAtmosEnabled() && data.levelInfo?.audioCodec?.includes("ec-3")) {
            console.log("Attempting to find magic data URI in LEVEL_LOADED for Atmos stream");
            // Aforementioned mode 2 for enhancedHls
            // #EXT-X-KEY:METHOD=SAMPLE-AES,URI="data:text/plain;base64,AAAAOHBzc2gAAAAA7e+LqXnWSs6jyCfc1R0h7QAAABgSEAAAAAAAAAAAczEvZTEgICBI88aJmwY=",KEYFORMAT="urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed",KEYFORMATVERSIONS="1"
            // There will be multiple keys, we need to match all of lines that contain a valid data: URL and do the filtering later, make sure to match the full line
            const regex2 = /#EXT-X-KEY:METHOD=SAMPLE-AES,URI="(data:[^"]+)",KEYFORMAT="urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed"/g;
            const matches = manifestText.matchAll(regex2);
            for (const m of matches) {
                if (m && m[0]?.includes('"urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed"') && m[1]?.startsWith("data:") && !m[1]?.includes("AAAAOHBzc2gAAAAA7e+LqXnWSs6jyCfc1R0h7QAAABgSEAAAAAAAAAAAczEvZTEgICBI88aJmwY=")) {
                    const magicDataURI = m[1];
                    console.log("Found magic data URI (enhancedHls):", magicDataURI);
                    instance.magicDataURI = "enhanced/" + magicDataURI;
                    instance.dolbyAtmosAvailable = true;
                    break;
                }
            }
        }

        tryAcquireLicense(instance);
    });

    // Track recovery attempts for non-fatal buffer stalls so we don't loop forever
    let stallRecoveryAttempts = 0;
    let lastStallRecoveryAt = 0;

    // Propagate fatal HLS errors to the global handler so playback can show a message
    instance.on(Hls.Events.ERROR, (event, data) => {
        console.error("HLS error event:", data);

        // If the didn't occur on the primary audio element, ignore it
        if (getActiveHlsInstance() !== instance) {
            console.warn("Ignoring HLS error from non-active instance");
            return;
        }

        try {
            const details = (data as any)?.details;

            // Active recovery for non-fatal `bufferStalledError`.
            //
            // hls.js's built-in nudge logic (_tryNudgeBuffer) only fires when there are
            // multiple buffered ranges with a hole, OR a `nextStart` exists. When the
            // playhead is wedged inside a single contiguous buffered range (typical at
            // the very start of a track when the audio element claims to be unpaused
            // but currentTime never advances) hls.js reports the stall once with
            // `fatal: false` and then does nothing -- the user just sees silence.
            //
            // We work around that here by nudging currentTime forward and re-issuing
            // play(), which kicks the decoder/EME pipeline in essentially every case
            // we've seen in user reports.
            if (details === "bufferStalledError" && data && !(data as any).fatal) {
                const media = instance.media as HTMLMediaElement | null;
                if (media) {
                    // Reset the attempt counter if the previous stall was a while ago
                    const now = performance.now();
                    if (now - lastStallRecoveryAt > 30_000) {
                        stallRecoveryAttempts = 0;
                    }
                    lastStallRecoveryAt = now;

                    if (stallRecoveryAttempts < 5) {
                        stallRecoveryAttempts++;
                        const bufferEnd = (data as any)?.bufferInfo?.end ?? 0;
                        const nudgeTarget = Math.min(
                            bufferEnd - 0.05,
                            media.currentTime + 0.1 * stallRecoveryAttempts
                        );

                        console.warn(
                            `[FocalMK] Recovering from non-fatal buffer stall (attempt ${stallRecoveryAttempts}): ` +
                            `nudging currentTime ${media.currentTime} -> ${nudgeTarget}`
                        );

                        try {
                            if (nudgeTarget > media.currentTime) {
                                media.currentTime = nudgeTarget;
                            }
                            // Re-issue play() in case the audio element silently paused
                            // (autoplay policy expiry, audio device transition, etc.)
                            const p = media.play();
                            if (p && typeof p.catch === "function") {
                                p.catch(err => console.warn("[FocalMK] play() during stall recovery rejected:", err));
                            }
                        }
                        catch (recoverErr) {
                            console.warn("[FocalMK] Stall recovery threw:", recoverErr);
                        }
                        return;
                    }

                    // Repeated stalls -- escalate so the user actually sees something
                    console.error("[FocalMK] Buffer stall could not be recovered after multiple attempts");
                    handleError("Playback is stuck and could not recover. Please try skipping this song.");
                    return;
                }
            }

            if (data && (data as any).fatal) {
                const details = (data as any).error?.message || JSON.stringify(data);
                handleError(details);
            }
        }
        catch (e) {
            // Swallow handler errors but log
            console.error("Error while handling HLS error:", e);
        }
    });

    return instance;
}

export function getActiveHlsInstance() : FocalHls {
    return getAudioElement().attachedHls as FocalHls;
}