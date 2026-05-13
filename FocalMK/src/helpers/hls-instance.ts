import { tryAcquireLicense } from "../drm/license";
import handleError from "../helpers/error-handler";
import Hls from "../playback/hls.js";
import { isAtmosEnabled } from "./atmos";
import { base64ToUint8Array, uint8ArrayToBase64 } from "./base64";
import { getAudioElement } from "./dom";
import { getAudioEffectController } from "../playback/audio-effects.js";
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

    // Track recovery state for non-fatal buffer stalls.
    //
    // Why we need this: hls.js only fires the BUFFER_STALLED_ERROR event ONCE per
    // stall (it sets an internal `stallReported` flag that's only cleared once the
    // playhead actually moves). So we can't drive recovery off the ERROR event --
    // if our first attempt doesn't unstick playback, no further events arrive and
    // playback sits silently broken. Instead, we kick off our own watchdog loop.
    let stallWatchdogTimer: number | null = null;
    let stallRecoveryAttempts = 0;

    const clearStallWatchdog = () => {
        if (stallWatchdogTimer !== null) {
            window.clearTimeout(stallWatchdogTimer);
            stallWatchdogTimer = null;
        }
    };

    const attemptStallRecovery = () => {
        stallWatchdogTimer = null;

        const media = instance.media as HTMLMediaElement | null;
        if (!media || getActiveHlsInstance() !== instance) {
            // Instance is no longer the active one; stop trying.
            stallRecoveryAttempts = 0;
            return;
        }

        const beforeTime = media.currentTime;
        stallRecoveryAttempts++;

        // Step 1 (always): make sure the Web Audio graph is actually running.
        //
        // The audio-effects controller routes the audio element through a
        // MediaElementAudioSourceNode. If its AudioContext is `suspended` (very
        // common when the user-gesture activation expired during license/manifest
        // fetches) the media element is gated -- output is silent AND currentTime
        // never advances, which produces exactly the bufferStalledError pattern
        // we've been seeing in user reports.
        try {
            const ctrl: any = getAudioEffectController(media);
            const ctx: AudioContext | undefined = ctrl?.audioCtx;
            if (ctx && ctx.state === "suspended") {
                console.warn("[FocalMK] AudioContext is suspended during stall; resuming");
                ctx.resume().catch(err => {
                    console.warn("[FocalMK] AudioContext.resume() rejected:", err);
                });
            }
        }
        catch (ctxErr) {
            console.warn("[FocalMK] Error inspecting AudioContext during stall recovery:", ctxErr);
        }

        try {
            if (stallRecoveryAttempts <= 2) {
                // Step 2: gentle nudge -- bump currentTime forward inside the buffered range
                // and re-issue play() in case the element silently paused.
                const bufferEnd = (() => {
                    try {
                        return media.buffered.length > 0 ? media.buffered.end(media.buffered.length - 1) : 0;
                    } catch { return 0; }
                })();
                const nudgeTarget = Math.min(
                    Math.max(bufferEnd - 0.05, 0),
                    media.currentTime + 0.1 * stallRecoveryAttempts
                );

                console.warn(
                    `[FocalMK] Stall recovery attempt ${stallRecoveryAttempts}: ` +
                    `nudge currentTime ${media.currentTime} -> ${nudgeTarget}`
                );

                if (nudgeTarget > media.currentTime) {
                    media.currentTime = nudgeTarget;
                }
                const p = media.play();
                if (p && typeof p.catch === "function") {
                    p.catch(err => console.warn("[FocalMK] play() during stall recovery rejected:", err));
                }
            }
            else if (stallRecoveryAttempts === 3) {
                // Step 3: ask hls.js to recover the media pipeline.
                console.warn(`[FocalMK] Stall recovery attempt ${stallRecoveryAttempts}: recoverMediaError()`);
                try { instance.recoverMediaError?.(); } catch (e) { console.warn("recoverMediaError threw:", e); }
                const p = media.play();
                if (p && typeof p.catch === "function") {
                    p.catch(err => console.warn("[FocalMK] play() after recoverMediaError rejected:", err));
                }
            }
            else if (stallRecoveryAttempts === 4) {
                // Step 4: full source reload. Last-ditch before giving up.
                console.warn(`[FocalMK] Stall recovery attempt ${stallRecoveryAttempts}: reloading source`);
                try {
                    const url = instance.playbackSource?.bestAsset?.URL || instance.playbackSource?.backupAsset?.URL;
                    if (url) {
                        instance.stopLoad();
                        instance.loadSource(url);
                        instance.startLoad(0);
                        const p = media.play();
                        if (p && typeof p.catch === "function") {
                            p.catch(err => console.warn("[FocalMK] play() after reload rejected:", err));
                        }
                    }
                } catch (e) {
                    console.warn("source reload threw:", e);
                }
            }
            else {
                // Give up; surface a real error to the user.
                console.error("[FocalMK] Buffer stall could not be recovered after multiple attempts");
                handleError("Playback is stuck and could not recover. Please try skipping this song.");
                stallRecoveryAttempts = 0;
                return;
            }
        }
        catch (recoverErr) {
            console.warn("[FocalMK] Stall recovery threw:", recoverErr);
        }

        // Schedule a follow-up check. If currentTime advanced, we'll clear the
        // counter and stop; otherwise we escalate.
        stallWatchdogTimer = window.setTimeout(() => {
            const m = instance.media as HTMLMediaElement | null;
            if (!m) { stallRecoveryAttempts = 0; return; }
            if (m.currentTime > beforeTime + 0.05) {
                console.log("[FocalMK] Playback recovered from stall");
                stallRecoveryAttempts = 0;
                return;
            }
            attemptStallRecovery();
        }, 1500);
    };

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

            if (details === "bufferStalledError" && data && !(data as any).fatal) {
                // Only kick off the watchdog if it isn't already running. hls.js only
                // fires this event once per stall, so we can't rely on repeated events.
                if (stallWatchdogTimer === null && stallRecoveryAttempts === 0) {
                    attemptStallRecovery();
                }
                return;
            }

            if (data && (data as any).fatal) {
                clearStallWatchdog();
                stallRecoveryAttempts = 0;
                const msg = (data as any).error?.message || JSON.stringify(data);
                handleError(msg);
            }
        }
        catch (e) {
            // Swallow handler errors but log
            console.error("Error while handling HLS error:", e);
        }
    });

    // Clear watchdog state when playback resolves naturally.
    instance.on(Hls.Events.DESTROYING, () => {
        clearStallWatchdog();
        stallRecoveryAttempts = 0;
    });

    return instance;
}

export function getActiveHlsInstance() : FocalHls {
    return getAudioElement().attachedHls as FocalHls;
}