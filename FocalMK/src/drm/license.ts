import { getFetchHeaders } from "../auth/headers";
import { isAtmosEnabled } from "../helpers/atmos";
import { licenseURL, widevineCertURL } from "../helpers/constants";
import { FocalHls } from "../helpers/hls-instance";
import { tryWrapAppleMusicURL } from "../helpers/igniteview";
import { getPssh } from "./pssh";

interface LicenseResponse {
    license: string | Uint8Array;
    "renew-after": number;
}

export function tryAcquireLicense(hls: FocalHls) {
    if (hls?.contentID && hls.magicDataURI && !hls.licenseAcquired) {
        hls.licenseAcquired = true;
        console.log("Acquiring license for content ID:", hls.contentID);
        licenseForWebPlayback(hls, hls.contentID!).then(() => {
            console.log("License acquired, attaching media");
            hls.attachMedia(hls.mediaToAttach);
        });
    }
    else if (isAtmosEnabled() && !hls.dolbyAtmosAvailable && hls.useDesirableAsset) {
        console.warn("Dolby Atmos not available for this content, switching to backup asset");
        hls.useDesirableAsset = false;
        setTimeout(() => {
            hls.loadSource(hls.playbackSource.backupAsset?.URL || "");
        }, 0);
    }
}

export function acquireWidevineAccess() {
    return new Promise<MediaKeySystemAccess>((resolve, reject) => {
        const widevineKeySystem = 'com.widevine.alpha';
        if (navigator.requestMediaKeySystemAccess) {
            const config: MediaKeySystemConfiguration[] = [{
                initDataTypes: ['cenc'], // Common Encryption
                audioCapabilities: [
                    {
                        contentType: 'audio/mp4; codecs="mp4a.40.2"'
                    },
                    {
                        contentType: 'audio/mp4; codecs="ec-3"',
                        robustness: 'SW_SECURE_DECODE'
                    }
                ],
                videoCapabilities: [
                    {
                        contentType: 'video/mp4; codecs="avc1.42E01E"',
                        robustness: 'SW_SECURE_DECODE'
                    }
                ],
                distinctiveIdentifier: 'optional' as MediaKeysRequirement,
                persistentState: 'optional' as MediaKeysRequirement,
                sessionTypes: ['temporary' as MediaKeySessionType]
            }];

            // Request access to the key system
            navigator.requestMediaKeySystemAccess(widevineKeySystem, config)
                .then(resolve)
                .catch(reject);
        }
    });
}

declare global {
    interface Window {
        widevineCertCache?: Uint8Array;
    }
}

async function acquireWidevineCert() {

    if (window.widevineCertCache) {
        return window.widevineCertCache;
    }

    const req = await fetch(widevineCertURL);
    const certBuffer = await req.arrayBuffer();
    const serverCertificate = new Uint8Array(certBuffer);
    window.widevineCertCache = serverCertificate; // Cache cause the request takes a while
    return serverCertificate;
}

export async function acquireWebPlaybackLicense(challenge: string, contentID: string, magicDataURI: string): Promise<LicenseResponse> {
    const reqBody = {
        adamId: contentID,
        "key-system": "com.widevine.alpha",
        "user-initiated": true,
        isLibrary: false,
        uri: magicDataURI.replace("enhanced/", ""),
        challenge: challenge,
    };

    const request = await fetch(tryWrapAppleMusicURL(licenseURL), {
        method: "POST",
        headers: { ...await getFetchHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(reqBody),
    });
    
    const response: LicenseResponse = await request.json();

    if (response?.license) {
        response.license = Uint8Array.fromBase64(response.license);
    }

    return response;
}

export function licenseForWebPlayback(hls: FocalHls, contentID: string) {

    if (!hls.mediaToAttach) return;
    const initData = getPssh(hls.magicDataURI!);

    return new Promise<void>(async (resolve, reject) => {

        if (!hls.magicDataURI) reject();

        const widevine = await acquireWidevineAccess();
        const certificate = await acquireWidevineCert();

        const mediaKeys = await widevine.createMediaKeys();
        await mediaKeys.setServerCertificate(certificate);
        const session = mediaKeys.createSession();

        // Attach the keys to the audio element
        hls.mediaToAttach!.src = "";
        hls.mediaToAttach!.setMediaKeys(mediaKeys);

        const getLicenseFromChallenge = async (challenge: string) => {
            const license = await acquireWebPlaybackLicense(challenge, contentID, hls.magicDataURI!);

            console.log("License acquired for content ID:", contentID);
            await session.update(license.license);
        }

        session.addEventListener('message', async (event) => {
            console.log("License Message Event:", event);
            if (event.messageType === 'license-request') {
                const challengeBase64 = new Uint8Array(event.message).toBase64();
                await getLicenseFromChallenge(challengeBase64);

                if (isAtmosEnabled()) {
                    await licenseForAtmos(hls, mediaKeys, contentID);
                }
            
                resolve();
            }
            else if (event.messageType === 'license-renewal') {
                const challengeBase64 = new Uint8Array(event.message).toBase64();
                await getLicenseFromChallenge(challengeBase64);
            }
        }, false);

        console.log("Generating license request with initData:", initData.toBase64());
        session.generateRequest("cenc", initData);

    });
}

export function licenseForAtmos(hls: FocalHls, mediaKeys: MediaKeys, contentID: string) {

    if (!hls.dolbyAtmosAvailable) return;

    return new Promise<void>((resolve, reject) => {
        const session = mediaKeys.createSession();
        
        session.addEventListener('message', async (event) => {
            console.log("Atmos License Message Event:", event);
            if (event.messageType === 'license-request' || event.messageType === 'license-renewal') {
                const challengeBase64 = new Uint8Array(event.message).toBase64();
                const license = await acquireWebPlaybackLicense(challengeBase64, contentID, "enhanced/data:text/plain;base64,AAAAOHBzc2gAAAAA7e+LqXnWSs6jyCfc1R0h7QAAABgSEAAAAAAAAAAAczEvZTEgICBI88aJmwY=");
                await session.update(license.license);

                resolve();
            }
        }, false);

        console.log("Generating additional atmos license request");
        session.generateRequest("cenc", Uint8Array.fromBase64("AAAAOHBzc2gAAAAA7e+LqXnWSs6jyCfc1R0h7QAAABgSEAAAAAAAAAAAczEvZTEgICBI88aJmwY=")); // Hardcoded PSSH for atmos
    });
}