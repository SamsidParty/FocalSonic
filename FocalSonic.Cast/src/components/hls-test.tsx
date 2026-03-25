import { useEffect } from "react";
import { loadContent } from "../lib/focalmk";


export default function HlsTest() {

    useEffect(() => {
        if (window.doneAA) return;
        window.doneAA = true;

        setTimeout(async () => {
            await loadContent("1679278167");
        }, 0);
    }, []);

    return (
        <>
            <h1 className="text-white">HLS Test</h1>
            <audio controls id="audio"></audio>
        </>
    );
}