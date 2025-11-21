import { useEffect } from "react";
import { focalHls, licenseForWebPlayback } from "../lib/focalmk";


export default function HlsTest() {

    useEffect(() => {     
            const audio = document.getElementById('audio');
            const videoSrc = 'https://aod-ssl.itunes.apple.com/itunes-assets/Music211/v4/da/00/f3/da00f3f3-e6bb-4467-2c44-d604ba61a29c/mzaf_A1785614776.rphq.aac.wa.m3u8';
            // data:;base64,AAAAAGQXwFcAHWcYFC6aTw==

            if (window.doneAA) return;
            window.doneAA = true;

            
            focalHls.loadSource(videoSrc);
            licenseForWebPlayback(audio, "1785614776").then(() => focalHls.attachMedia(audio));
    }, []);

    return (
        <>
            <h1 className="text-white">HLS Test</h1>
            <audio controls id="audio"></audio>
        </>
    );
}