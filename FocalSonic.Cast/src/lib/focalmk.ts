import Hls from "hls.js";


/* eslint-disable no-async-promise-executor */
const licenseURL = "https://play.itunes.apple.com/WebObjects/MZPlay.woa/wa/acquireWebPlaybackLicense";
const widevineCertURL = "https://play.itunes.apple.com/WebObjects/MZPlay.woa/wa/widevineCert";


export const focalHls = new Hls({
    debug: true,
    emeEnabled: false, // Custom DRM implementation, turn off the default one
    drmSystemOptions: {}
});

focalHls.on(Hls.Events.MANIFEST_LOADED, (event, data) => {
    const manifestText = data.networkDetails?.responseText || "";  
    
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
});


const appleMagic1 = [0, 0, 1, 222, 112, 115, 115, 104, 0, 0, 0, 0, 154, 4, 240, 121, 152, 64, 66, 134, 171, 146, 230, 91, 224, 136, 95, 149, 0, 0, 1, 190];

function applePssh() {
    const e = Uint8Array.from(appleMagic1);
    const n = new Uint8Array([0, 0, 0, 52, 112, 115, 115, 104, 0, 0, 0, 0, 237, 239, 139, 169, 121, 214, 74, 206, 163, 200, 39, 220, 213, 29, 33, 237, 0, 0, 0, 20, 8, 1, 18, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    for (let d = 0; d < e.length; d++)
        n[n.length - 16 + d] = e[d];
    return n
}

function appleMagic(licenseURL) {
    if (licenseURL.includes("base64,")) {
        const split1 = licenseURL.split(",");
        const split2 = Uint8Array.fromBase64(split1[1].split("=")[0]);
        // Concat appleMagic1 + split2
        return Uint8Array.from([...appleMagic1, ...split2]);
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
        uri: magicDataURI,
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

export function acquireWidevineAccess() {
    return new Promise<MediaKeySystemAccess>((resolve, reject) => {
        const widevineKeySystem = 'com.widevine.alpha';
        if (navigator.requestMediaKeySystemAccess) {
            // Define the configuration
            const config = [{
                initDataTypes: ['cenc'], // Common Encryption
                audioCapabilities: [{
                    contentType: 'audio/mp4; codecs="mp4a.40.2"'
                }],
            }];

            // Request access to the key system
            navigator.requestMediaKeySystemAccess(widevineKeySystem, config)
                .then(resolve)
                .catch(reject);
        }
    });
}

export function licenseForWebPlayback(audio: HTMLAudioElement | null = null, contentID: string) {
    return new Promise<void>(async (resolve, reject) => {
        const widevine = await acquireWidevineAccess();
        const certificate = await acquireWidevineCert();

        const mediaKeys = await widevine.createMediaKeys();
        await mediaKeys.setServerCertificate(certificate);
        const session = mediaKeys.createSession();
        audio?.setMediaKeys(mediaKeys);

        session.addEventListener('message', async (event) => {
            console.log("License Message Event:", event);
            if (event.messageType === 'license-request') {
                const challengeBase64 = new Uint8Array(event.message).toBase64();
                const license = await acquireWebPlaybackLicense(challengeBase64, contentID, focalHls?.magicDataURI || "");
                await session.update(new Uint8Array(license));
                resolve();
            }
        }, false);

        const initData = applePssh();
        session.generateRequest("cenc", initData);
    });
}
