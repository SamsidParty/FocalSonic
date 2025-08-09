import { getCoverArtUrl } from "@/api/httpClient.js";
import { usePlayerCurrentSong, useSongColor } from "@/store/player.store";
import { hexToRgba } from "@/utils/getAverageColor";
import clsx from "clsx";
import { useEffect, useMemo, useRef } from "react";
import { LyricsScene } from "../../../lib/lyricsScene.js";

let GlobalLyricsScene: LyricsScene = null;

interface BackdropProps {
    lightenBackground: boolean
}

export function useFullscreenBackdrop(props: BackdropProps) {
    const { useSongColorOnQueue } = useSongColor();

    return useMemo(() => {
        if (!useSongColorOnQueue) {
            return <DynamicColorBackdrop {...props}></DynamicColorBackdrop>;
        }

        return <SwirlBackdrop {...props}></SwirlBackdrop>;
    }, [useSongColorOnQueue, props]);
}

function SwirlBackdrop(props: BackdropProps) {

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
        <div
            className={
                clsx(
                    "absolute inset-0 w-full h-full -z-1 transition-opacity duration-500",
                    props.lightenBackground && "opacity-40"
                )
            }
        >
            <canvas
                ref={canvasRef}
                className="w-full h-full"
            />
        </div>
    );
}


function DynamicColorBackdrop(props: BackdropProps) {
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
