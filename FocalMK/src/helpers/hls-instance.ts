import { tryAcquireLicense } from "../drm/license";
import Hls from "../playback/hls.js";
import { isAtmosEnabled } from "./atmos";
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
                const binaryData = Uint8Array.fromBase64(base64Data);
                const keyID = binaryData.slice(34, 34 + 16); // Key ID is located at byte offset 34, length 16 bytes
                console.log("Atmos Key ID:", keyID.toBase64());

                // Forward to the proxy that will edit the key IDs before it reaches the client
                const newUrl = window.igniteView.resolverURL + "/streaming-atmos-v1?" + encodeURIComponent(url);
                xhr.open("GET", newUrl, true);
                xhr.setRequestHeader("x-atmos-keyid", keyID.toBase64());
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

    return instance;
}

export function getActiveHlsInstance() : FocalHls {
    return getAudioElement().attachedHls as FocalHls;
}