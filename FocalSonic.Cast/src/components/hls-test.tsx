import Hls from "hls.js";
import { useEffect } from "react";
import { licenseForWebPlayback } from "../lib/focalmk";

function applyCredentials(xhr: XMLHttpRequest) {
    xhr.withCredentials = true;
    xhr.setRequestHeader("Authorization", `Bearer ` + window.appleMusicDeveloperToken);
    xhr.setRequestHeader("X-Apple-Music-User-Token", `ArtrW+GDMTxB5jIO2G1yBU1NqGdY4hqxDIZdnY17Knmg6Q0q2POjahUroexArY5nWdC0vviL8cS9dntXsvoP2G+JwCSMW/tjZRwrq1iF39TSDFfBi3lcklcGm/6s+LeAIBvICW1EaffwqrPhSGpEZQqR6jX/4sEhUxFstfMQ7bxNV03I1Lue4fKtUrfDftaxa8t025i6JXx3FQuh8naAklYXfUl7FoNRWdEGbnjFFPdYdQKYrg==`);
    xhr.setRequestHeader("X-Apple-Renewal", "1");
}

export default function HlsTest() {

    useEffect(() => {     
            const video = document.getElementById('audio');
            const videoSrc = 'https://aod-ssl.itunes.apple.com/itunes-assets/Music221/v4/58/30/7a/58307aef-3f4c-207d-2f7c-e590b2bdb9a6/mzaf_A1679278167.rphq.aac.wa.m3u8';
            // data:;base64,AAAAAGQXwFcAHWcYFC6aTw==

            if (window.doneAA) return;
            window.doneAA = true;

            licenseForWebPlayback(video).then(() => {
                const hls = new Hls({
                    emeEnabled: false,
                    drmSystemOptions: {},
                    debug: true,
                });
                hls.attachMedia(video);
                hls.loadSource(videoSrc);
            });
    }, []);

    return (
        <>
            <h1 className="text-white">HLS Test</h1>
            <audio controls id="audio"></audio>
        </>
    );
}