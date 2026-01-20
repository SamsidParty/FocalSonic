import { getFetchHeaders } from "../auth/headers";
import { isAtmosEnabled } from "../helpers/atmos";
import { base64ToUint8Array, uint8ArrayToBase64 } from "../helpers/base64";
import { licenseURL, widevineCertURL } from "../helpers/constants";
import { FocalHls } from "../helpers/hls-instance";
import { tryWrapAppleMusicURL } from "../helpers/igniteview";
import { getPssh } from "./pssh";

interface LicenseResponse {
    license: string | Uint8Array;
    "renew-after": number;
    customerMessage?: string;   
}

// Track active renewal timers for cleanup
const licenseRenewalTimers = new WeakMap<FocalHls, number>();

export function tryAcquireLicense(hls: FocalHls) {
    if (hls?.contentID && hls.magicDataURI && !hls.licenseAcquired) {
        hls.licenseExpired = false;
        hls.licenseAcquired = true;
        
        // Clear any existing renewal timer
        clearLicenseRenewalTimer(hls);
        
        console.log("Acquiring license for content ID:", hls.contentID);
        licenseForWebPlayback(hls, hls.contentID!).then(() => {
            console.log("License acquired, attaching media");
            if (!hls.media) {
                hls.attachMedia(hls.mediaToAttach);
            }
        });
    }
    else if (isAtmosEnabled() && !hls.dolbyAtmosAvailable && hls.useDesirableAsset) {
        console.warn("Dolby Atmos not available for this content, switching to backup asset");

        if (window.igniteView) {
            window.igniteView.commandBridge.setPlayerCallbackData(`atmos-state-${hls.contentID}`, "failed");
        }

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
                initDataTypes: ['cenc', 'keyids'], // Common Encryption
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
                persistentState: 'required' as MediaKeysRequirement,
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
        response.license = base64ToUint8Array(response.license as string);
    }
    else if (response?.customerMessage) {
        window.igniteView?.commandBridge?.displayError?.("Something went wrong with Apple Music", response.customerMessage);
    }

    return response;
}

/**
 * Schedule a license renewal before the current license expires
 */
function scheduleLicenseRenewal(hls: FocalHls, session: MediaKeySession, renewAfterSeconds: number, contentID: string) {
    // Clear any existing timer
    clearLicenseRenewalTimer(hls);
    
    // Schedule renewal at 80% of the renew-after time to ensure we renew before expiration
    const renewalDelayMs = Math.max((renewAfterSeconds * 0.8) * 1000, 30000); // At least 30 seconds
    
    console.log(`Scheduling license renewal in ${renewalDelayMs / 1000} seconds for content ID:`, contentID);
    
    const timerId = window.setTimeout(async () => {
        if (!hls || hls.licenseExpired) return;
        
        console.log("Proactively renewing license for content ID:", contentID);
        try {
            // Generate a new license request for renewal
            await renewLicenseSession(hls, session, contentID);
        } catch (err) {
            console.error("Failed to renew license:", err);
            hls.licenseExpired = true;
        }
    }, renewalDelayMs);
    
    licenseRenewalTimers.set(hls, timerId);
}

/**
 * Renew an existing license session
 */
async function renewLicenseSession(hls: FocalHls, session: MediaKeySession, contentID: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const messageHandler = async (event: MediaKeyMessageEvent) => {
            if (event.messageType === 'license-request' || event.messageType === 'license-renewal') {
                try {
                    const challengeBase64 = uint8ArrayToBase64(new Uint8Array(event.message));
                    const license = await acquireWebPlaybackLicense(challengeBase64, contentID, hls.magicDataURI!);
                    await session.update(license.license as Uint8Array);
                    
                    // Schedule the next renewal
                    if (license["renew-after"] && license["renew-after"] > 0) {
                        scheduleLicenseRenewal(hls, session, license["renew-after"], contentID);
                    }
                    
                    session.removeEventListener('message', messageHandler);
                    resolve();
                } catch (err) {
                    session.removeEventListener('message', messageHandler);
                    reject(err);
                }
            }
        };
        
        session.addEventListener('message', messageHandler);
        
        // Trigger license renewal by updating with an empty response to prompt a new challenge
        // This causes the CDM to generate a new license-renewal message
        const initData = getPssh(hls.magicDataURI!);
        session.generateRequest("cenc", initData).catch(reject);
    });
}

/**
 * Clear the license renewal timer for an HLS instance
 */
export function clearLicenseRenewalTimer(hls: FocalHls) {
    const existingTimer = licenseRenewalTimers.get(hls);
    if (existingTimer) {
        window.clearTimeout(existingTimer);
        licenseRenewalTimers.delete(hls);
    }
}

export function licenseForWebPlayback(hls: FocalHls, contentID: string) {

    if (!hls.mediaToAttach) return;
    const initData = getPssh(hls.magicDataURI!);

    return new Promise<void>(async (resolve, reject) => {

        if (!hls.magicDataURI) reject();

        // Run Widevine access and certificate requests concurrently for faster startup
        const [widevine, certificate] = await Promise.all([
            acquireWidevineAccess(),
            acquireWidevineCert()
        ]);

        const mediaKeys = await widevine.createMediaKeys();
        await mediaKeys.setServerCertificate(certificate);
        const session = mediaKeys.createSession();

        // Attach the keys to the audio element
        hls.mediaToAttach!.src = "";
        hls.mediaToAttach!.setMediaKeys(mediaKeys);

        const getLicenseFromChallenge = async (challenge: string) => {
            const license = await acquireWebPlaybackLicense(challenge, contentID, hls.magicDataURI!);

            console.log("License acquired for content ID:", contentID);
            await session.update(license.license as Uint8Array);
            
            // Schedule proactive license renewal based on renew-after
            if (license["renew-after"] && license["renew-after"] > 0) {
                scheduleLicenseRenewal(hls, session, license["renew-after"], contentID);
            }
        }

        // Store session reference for potential renewal
        hls.mediaKeySession = session;

        session.addEventListener('message', async (event) => {
            console.log("License Message Event:", event);
            if (event.messageType === 'license-request') {
                const challengeBase64 = uint8ArrayToBase64(new Uint8Array(event.message));
                await getLicenseFromChallenge(challengeBase64);

                if (isAtmosEnabled()) {
                    await licenseForAtmos(hls, mediaKeys, contentID);
                }
                else {
                    if (window.igniteView) {
                        window.igniteView.commandBridge.setPlayerCallbackData(`atmos-state-${hls.contentID}`, "inactive");
                    }
                }
            
                resolve();
            }
            else if (event.messageType === 'license-renewal') {
                // Handle renewal requests from the CDM
                const challengeBase64 = uint8ArrayToBase64(new Uint8Array(event.message));
                await getLicenseFromChallenge(challengeBase64);
                console.log("License renewed for content ID:", contentID);
            }
        }, false);

        session.addEventListener('keystatuseschange', (event) => {
            // Check key statuses for expiration
            session.keyStatuses.forEach((status, keyId) => {
                if (status === 'expired') {
                    console.warn("Key expired for content ID:", contentID);
                    hls.licenseAcquired = false;
                    hls.licenseExpired = true;
                }
            });
            
            // Also check session expiration time
            if (session.expiration && session.expiration !== Infinity) {
                const timeUntilExpiration = session.expiration - Date.now();
                if (timeUntilExpiration <= 0) {
                    console.warn("License expired for content ID:", contentID);
                    hls.licenseAcquired = false;
                    hls.licenseExpired = true;
                } else if (timeUntilExpiration < 60000 && !licenseRenewalTimers.has(hls)) {
                    // Less than 1 minute until expiration and no renewal scheduled, try to renew now
                    console.log("License expiring soon, attempting immediate renewal");
                    renewLicenseSession(hls, session, contentID).catch(err => {
                        console.error("Emergency license renewal failed:", err);
                    });
                }
            }
        }, false);

        console.log("Generating license request with initData:", uint8ArrayToBase64(initData));
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
                const challengeBase64 = uint8ArrayToBase64(new Uint8Array(event.message));
                const license = await acquireWebPlaybackLicense(challengeBase64, contentID, "enhanced/data:text/plain;base64,AAAAOHBzc2gAAAAA7e+LqXnWSs6jyCfc1R0h7QAAABgSEAAAAAAAAAAAczEvZTEgICBI88aJmwY=");
                await session.update(license.license);

                if (window.igniteView) {
                    window.igniteView.commandBridge.setPlayerCallbackData(`atmos-state-${hls.contentID}`, "active");
                }

                resolve();
            }
        }, false);

        console.log("Generating additional atmos license request");
        session.generateRequest("cenc", base64ToUint8Array("AAAAOHBzc2gAAAAA7e+LqXnWSs6jyCfc1R0h7QAAABgSEAAAAAAAAAAAczEvZTEgICBI88aJmwY=")); // Hardcoded PSSH for atmos
    });
}