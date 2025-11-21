/* eslint-disable no-empty */
import Hls from "hls.js";


/* eslint-disable no-async-promise-executor */
const licenseURL = "https://play.itunes.apple.com/WebObjects/MZPlay.woa/wa/acquireWebPlaybackLicense";
const widevineCertURL = "https://play.itunes.apple.com/WebObjects/MZPlay.woa/wa/widevineCert";
const webPlaybackURL = "https://play.music.apple.com/WebObjects/MZPlay.woa/wa/webPlayback";

const enableAtmos = true;

export function getAudioElement(): HTMLAudioElement {
    let audioElement = document.getElementById('apple-music-player');
    if (!audioElement) {
        audioElement = document.createElement('audio');
        audioElement.id = 'apple-music-player';
        audioElement.className = 'focalmk-audio-element';
        document.body.appendChild(audioElement);
    }
    return audioElement as HTMLAudioElement;
}

export const focalHls = new Hls({
    debug: true,
    emeEnabled: false, // Custom DRM implementation, turn off the default one
    drmSystemOptions: {}
});

focalHls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
    data.levels.forEach((level, id) => {
        if (enableAtmos && level?.audioCodec?.includes("ec-3")) {
            console.log("Selecting Dolby Atmos audio level:", level);
            focalHls.startLevel = id;
            focalHls.currentLevel = id;
            focalHls.nextAutoLevel = id;
            focalHls.nextLoadLevel = id;
            focalHls.loadLevel = id;
        }
    });
});

focalHls.on(Hls.Events.MANIFEST_LOADED, (event, data) => {
    const manifestText = data.networkDetails?.responseText || "";

    console.log(data)


    // We need to find the magic data URI from the manifest
    // The target line is in the format: #EXT-X-KEY:METHOD=ISO-23001-7,URI="data:;base64,AAAAAGQXwFcAHWcYFC6aTw=="
    // The format is flexible according to HLS spec, so we use a regex to find it
    const regex = /#EXT-X-KEY:.*URI="(data:;base64,[^"]+)"/;
    const match = manifestText.match(regex);
    if (match && match[1]) {
        const magicDataURI = match[1];
        console.log("Found magic data URI:", magicDataURI);
        focalHls.magicDataURI = magicDataURI;
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
                    //focalHls.magicDataURI = "enhanced/" + keyInfo[1]["urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed"]?.URI;
                    console.log("Found magic data URI (enhancedHls):", focalHls.magicDataURI);
                }
            });
        }

        // If that still didn't work, mode 2 will be called when the level is loaded
    }

    tryAcquireLicense();
});

focalHls.on(Hls.Events.LEVEL_LOADED, (event, data) => {

    const manifestText = data.networkDetails?.responseText || "";

    console.log("LEVEL_LOADED event received");
    if (!focalHls.magicDataURI && enableAtmos && data.levelInfo?.audioCodec?.includes("ec-3")) {
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
                focalHls.magicDataURI = "enhanced/" + magicDataURI;
                break;
            }
        }
    }

    tryAcquireLicense();
});


const appleMagic1 = [0, 0, 1, 222, 112, 115, 115, 104, 0, 0, 0, 0, 154, 4, 240, 121, 152, 64, 66, 134, 171, 146, 230, 91, 224, 136, 95, 149, 0, 0, 1, 190];
const appleMagic2 = [0, 0, 0, 52, 112, 115, 115, 104, 0, 0, 0, 0, 237, 239, 139, 169, 121, 214, 74, 206, 163, 200, 39, 220, 213, 29, 33, 237, 0, 0, 0, 20, 8, 1, 18, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

function getWebPlaybackPssh() {
    const e = Uint8Array.from(appleMagic1);
    const n = new Uint8Array(appleMagic2);
    for (let d = 0; d < e.length; d++)
        n[n.length - 16 + d] = e[d];
    return n
}

function getEnhancedPssh(licenseURL: string) {
    if (licenseURL.includes("base64,")) {
        const split = licenseURL.split(",");
        const base64Decoded = Uint8Array.fromBase64(split[1]);
        return base64Decoded;
    }
    throw new Error("Invalid enhanced PSSH license URL");
}

function getPssh(licenseURL: string) {
    if (!licenseURL) throw new Error("No license URL provided for PSSH generation");
    if (licenseURL.startsWith("enhanced/")) {
        return getEnhancedPssh(licenseURL.replace("enhanced/", ""));
    }
    return getWebPlaybackPssh();
}

function tryAcquireLicense() {
    if (focalHls?.contentID && focalHls.magicDataURI && !focalHls.licenseAcquired) {
        focalHls.licenseAcquired = true;
        console.log("Acquiring license for content ID:", focalHls.contentID);
        licenseForWebPlayback(getAudioElement(), focalHls.contentID).then(() => {
            console.log("License acquired, attaching media");
            focalHls.attachMedia(getAudioElement());
        });
    }
}

async function acquireWidevineCert() {
    const req = await fetch(widevineCertURL);
    const certBuffer = await req.arrayBuffer();
    const serverCertificate = new Uint8Array(certBuffer);
    return serverCertificate;
}

export async function acquireWebPlaybackLicense(challenge: string, contentID: string, magicDataURI: string): Promise<Uint8Array> {
    const reqBody = {
        adamId: contentID,
        "key-system": "com.widevine.alpha",
        "user-initiated": true,
        isLibrary: false,
        uri: magicDataURI.replace("enhanced/", ""),
        challenge: challenge,
    };

    const request = await fetch(licenseURL, {
        method: "POST",
        headers: { ...await getFetchHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(reqBody),
    });
    const response = await request.json();
    return Uint8Array.fromBase64(response.license);
}

export async function getFetchHeaders() {
    return {
        "Authorization": `Bearer ` + window.appleMusicDeveloperToken,
        "X-Apple-Music-User-Token": `ArtrW+GDMTxB5jIO2G1yBU1NqGdY4hqxDIZdnY17Knmg6Q0q2POjahUroexArY5nWdC0vviL8cS9dntXsvoP2G+JwCSMW/tjZRwrq1iF39TSDFfBi3lcklcGm/6s+LeAIBvICW1EaffwqrPhSGpEZQqR6jX/4sEhUxFstfMQ7bxNV03I1Lue4fKtUrfDftaxa8t025i6JXx3FQuh8naAklYXfUl7FoNRWdEGbnjFFPdYdQKYrg==`,
        "X-Apple-Renewal": "1",
    }
}

export async function getWebContentSources(contentID: string) {
    try {
        const request = await fetch(webPlaybackURL, {
            method: "POST",
            headers: { ...await getFetchHeaders(), "Content-Type": "application/json" },
            body: JSON.stringify({ salableAdamId: contentID }),
        });
        const response = await request.json();
        if (response?.status === 0) {
            return response?.songList;
        }
    }
    catch { }

    return null;
}

export function findBestWebContentSource(sources: any[]) {
    if (sources != null && sources.length > 0) {
        const song = sources[0];
        const validAssets = song?.assets?.filter((asset: any) => asset.URL && asset.URL.includes(".m3u8") && asset.flavor.includes(":ctrp")); // ctrp = compatible with widevine

        // Find the asset with the highest bitrate
        let bestAsset = null;
        let highestBitrate = -1;

        for (const asset of validAssets) {
            if (asset.metadata?.bitRate > highestBitrate) {
                highestBitrate = asset.metadata?.bitRate;
                bestAsset = asset;
            }
        }

        return bestAsset || null;
    }

    return null;
}

export function acquireWidevineAccess() {
    return new Promise<MediaKeySystemAccess>((resolve, reject) => {
        const widevineKeySystem = 'com.widevine.alpha';
        if (navigator.requestMediaKeySystemAccess) {
            // Define the configuration
            const config = [{
                initDataTypes: ['cenc'], // Common Encryption
                audioCapabilities: [
                    {
                        contentType: 'audio/mp4; codecs="mp4a.40.2"'
                    },
                    {
                        contentType: 'audio/mp4; codecs="ec-3"',
                        channels: 6,
                        robustness: 'SW_SECURE_DECODE' 
                    }
                ],
                videoCapabilities: [
                    {
                        contentType: 'video/mp4; codecs="avc1.42E01E"',
                        robustness: 'SW_SECURE_DECODE'
                    }
                ],
                distinctiveIdentifier: 'optional',
                persistentState: 'optional',
                sessionTypes: ['temporary']
            }];

            // Request access to the key system
            navigator.requestMediaKeySystemAccess(widevineKeySystem, config)
                .then(resolve)
                .catch(reject);
        }
    });
}

export function licenseForWebPlayback(audio: HTMLAudioElement | null = null, contentID: string) {

    if (!audio) {
        audio = getAudioElement();
    }

    return new Promise<void>(async (resolve, reject) => {
        const widevine = await acquireWidevineAccess();
        const certificate = await acquireWidevineCert();

        const mediaKeys = await widevine.createMediaKeys();
        await mediaKeys.setServerCertificate(certificate);
        const session = mediaKeys.createSession();

        // Attach the keys to the audio element
        audio.src = "";
        audio?.setMediaKeys(mediaKeys);

        session.addEventListener('message', async (event) => {
            console.log("License Message Event:", event);
            if (event.messageType === 'license-request') {
                const challengeBase64 = new Uint8Array(event.message).toBase64();
                const license = await acquireWebPlaybackLicense(challengeBase64, contentID, focalHls?.magicDataURI);
                await session.update(new Uint8Array(license));
                resolve();
            }
        }, false);

        const initData = getPssh(focalHls?.magicDataURI);
        console.log("Generating license request with initData:", initData);
        session.generateRequest("cenc", initData);
    });
}

export async function loadContent(contentID: string) {
    try {
        const sources = await getWebContentSources(contentID);
        const bestSource = findBestWebContentSource(sources);
        if (!bestSource) throw new Error("No valid content source found");

        let sourceURL = bestSource.URL;
        if (enableAtmos) {
            sourceURL = "https://aod.itunes.apple.com/itunes-assets/HLSMusic221/v4/be/ad/34/bead3418-e788-6ff9-8eec-705a1dafc7b3/P976156933_default.m3u8";
        }

        console.log("Using content source:", bestSource.flavor);

        focalHls.contentID = contentID;
        focalHls.loadSource(sourceURL);
    }
    catch (err) {
        // TODO: Handle error
        console.error("Error loading content:", err);
    }
}
window.loadContent = loadContent;