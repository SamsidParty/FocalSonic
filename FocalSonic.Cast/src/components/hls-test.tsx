import { useEffect } from "react";
import Hls from "../lib/hls.js";

function applyCredentials(xhr: XMLHttpRequest) {
    xhr.withCredentials = true;
    xhr.setRequestHeader("Authorization", `Bearer ` + window.appleMusicDeveloperToken);
    xhr.setRequestHeader("X-Apple-Music-User-Token", `ArtrW+GDMTxB5jIO2G1yBU1NqGdY4hqxDIZdnY17Knmg6Q0q2POjahUroexArY5nWdC0vviL8cS9dntXsvoP2G+JwCSMW/tjZRwrq1iF39TSDFfBi3lcklcGm/6s+LeAIBvICW1EaffwqrPhSGpEZQqR6jX/4sEhUxFstfMQ7bxNV03I1Lue4fKtUrfDftaxa8t025i6JXx3FQuh8naAklYXfUl7FoNRWdEGbnjFFPdYdQKYrg==`);
    xhr.setRequestHeader("X-Apple-Renewal", "1");
}

export default function HlsTest() {

    useEffect(() => {

                
            const video = document.getElementById('audio');
            const videoSrc = 'https://aod.itunes.apple.com/itunes-assets/HLSMusic221/v4/be/ad/34/bead3418-e788-6ff9-8eec-705a1dafc7b3/P976156933_default.m3u8';

            if (window.doneAA) return;
            window.doneAA = true;

            if (Hls.isSupported()) {


                const hls = new Hls({
                    debug: true,
                    emeEnabled: true,
                    defaultAudioCodec: 'ec-3',
                    drmSystems: {
                        "com.widevine.alpha": {
                            licenseUrl: "https://play.itunes.apple.com/WebObjects/MZPlay.woa/wa/acquireWebPlaybackLicense",
                            serverCertificateUrl: "https://play.itunes.apple.com/WebObjects/MZPlay.woa/wa/widevineCert",
                        },
                    },
                    licenseXhrSetup: (xhr, url, keyContext, licenseChallenge) => {
                        console.log("License XHR Setup", xhr, url, keyContext, licenseChallenge);
                        applyCredentials(xhr);

                        return JSON.stringify({
                            adamId: "1679278167",
                            "key-system": "com.widevine.alpha",
                            "user-initiated": true,
                            isLibrary: false,
                            uri: "data:;base64,AAAAAGQXwFcAHWcYFC6aTw==",
                            challenge: licenseChallenge.toBase64(),
                        });
                    }
                });
                hls.loadSource(videoSrc);
                hls.attachMedia(video);
            }

    }, []);

    return (
        <>
            <h1 className="text-white">HLS Test</h1>
            <audio controls id="audio"></audio>
        </>
    );
}