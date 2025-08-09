import { getCoverArtUrl } from "@/api/httpClient.js";
import { usePlayerCurrentSong, useSongColor } from "@/store/player.store";
import { hexToRgba } from "@/utils/getAverageColor";
import clsx from "clsx";
import { useEffect, useMemo, useRef } from "react";
import { LyricsScene } from "../../../lib/lyricsScene.js";

let GlobalLyricsScene: LyricsScene = null;

export function useFullscreenBackdrop() {
    const { useSongColorOnQueue } = useSongColor();

    return useMemo(() => {
        if (!useSongColorOnQueue) {
            return <DynamicColorBackdrop></DynamicColorBackdrop>;
        }

        return <SwirlBackdrop></SwirlBackdrop>;
    }, [useSongColorOnQueue]);
}

function SwirlBackdrop() {

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { coverArt } = usePlayerCurrentSong();
    const coverArtUrl = getCoverArtUrl(coverArt, "song", "300");

    useEffect(() => {
        if (canvasRef.current && !GlobalLyricsScene) {

            setTimeout(() => {
                if (!GlobalLyricsScene) {
                    GlobalLyricsScene = new LyricsScene(canvasRef.current, coverArtUrl);
                }
            }, 0);

            return () => {
                GlobalLyricsScene?.destroy();
                GlobalLyricsScene = null;
            };
        }

    }, []);

    useEffect(() => {
        GlobalLyricsScene?.updateArtwork(coverArtUrl);
    }, [coverArtUrl]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full -z-1"
        />
    );
}


function DynamicColorBackdrop() {
    const { currentSongColor, currentSongColorIntensity } = useSongColor();

    const backgroundColor = useMemo(() => {
        if (!currentSongColor) return undefined;

        return hexToRgba(currentSongColor, currentSongColorIntensity);
    }, [currentSongColor, currentSongColorIntensity]);

    return (
        <div
            className={clsx(
                "absolute inset-0 w-full h-full -z-1",
                "transition-[background-image,background-color] duration-1000",
                currentSongColor && "default-gradient",
            )}
            style={{ backgroundColor }}
        />
    );
}
