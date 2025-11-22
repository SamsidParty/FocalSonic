import { getFetchHeaders } from "../auth/headers";
import { isAtmosEnabled } from "../helpers/atmos";
import { licenseURL, widevineCertURL } from "../helpers/constants";
import { getAudioElement } from "../helpers/dom";
import { getActiveHlsInstance } from "../helpers/hls-instance";
import { getPssh } from "./pssh";

export function tryAcquireLicense() {
    if (getActiveHlsInstance()?.contentID && getActiveHlsInstance().magicDataURI && !getActiveHlsInstance().licenseAcquired) {
        getActiveHlsInstance().licenseAcquired = true;
        console.log("Acquiring license for content ID:", getActiveHlsInstance().contentID);
        licenseForWebPlayback(getAudioElement(), getActiveHlsInstance().contentID!).then(() => {
            console.log("License acquired, attaching media");
            getActiveHlsInstance().attachMedia(getAudioElement());
        });
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

export function licenseForWebPlayback(audio: HTMLAudioElement | null = null, contentID: string) {

    if (!audio) {
        audio = getAudioElement();
    }

    if (isAtmosEnabled()) {
        return Promise.resolve();
    }

    return new Promise<void>(async (resolve, reject) => {

        if (!getActiveHlsInstance()?.magicDataURI) reject();

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
                const license = await acquireWebPlaybackLicense(challengeBase64, contentID, getActiveHlsInstance().magicDataURI!);
                await session.update(new Uint8Array(license));
                resolve();
            }
        }, false);

        const initData = getPssh(getActiveHlsInstance().magicDataURI!);
        console.log("Generating license request with initData:", initData.toBase64());
        session.generateRequest("cenc", initData);
    });
}