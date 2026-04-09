import { getCoverArtUrl } from "@/api/httpClient.js";
import { useCustomFullscreenBackground, useDynamicColors, usePlayerCurrentSong } from "@/store/player.store";
import { hexToRgba } from "@/utils/getAverageColor";
import clsx from "clsx";
import { useEffect, useMemo, useRef } from "react";
import { LyricsScene } from "../../../lib/lyricsScene.js";
import VideoBackground from "./video-background.js";

let GlobalLyricsScene: LyricsScene = null;

interface BackdropProps {
    lightenBackground: boolean,
    overrideArtSample?: string
}

export function useFullscreenBackdrop(props: BackdropProps) {
    const { useDynamicColorsOnQueue } = useDynamicColors();
    const { customBackgroundType, videoBackgroundURL } = useCustomFullscreenBackground();
    const { lightenBackground, overrideArtSample } = props;

    return useMemo(() => {

        if (customBackgroundType === "video" && videoBackgroundURL) {
            return <div
                className={clsx(
                    "absolute inset-0 w-full h-full -z-1",
                )}
            >
                <VideoBackground className={clsx("transition-opacity duration-300", lightenBackground && "opacity-40")} videoUrl={videoBackgroundURL} />
            </div>;
        }

        if (!useDynamicColorsOnQueue) {
            return <DynamicColorBackdrop lightenBackground={lightenBackground} overrideArtSample={overrideArtSample}></DynamicColorBackdrop>;
        }

        return <SwirlBackdrop lightenBackground={lightenBackground} overrideArtSample={overrideArtSample}></SwirlBackdrop>;
    }, [useDynamicColorsOnQueue, lightenBackground, overrideArtSample, customBackgroundType, videoBackgroundURL]);
}

export function SwirlBackdrop(props: BackdropProps) {

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { coverArt } = usePlayerCurrentSong();
    const coverArtUrl = props.overrideArtSample || getCoverArtUrl(coverArt, "song", "300");

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
    const { currentSongColor, currentSongColorIntensity } = useDynamicColors();

    const backgroundColor = useMemo(() => {
        if (!currentSongColor) return undefined;

        return hexToRgba(currentSongColor, currentSongColorIntensity);
    }, [currentSongColor, currentSongColorIntensity]);

    return (
        <div
            className={clsx(
                "absolute inset-0 w-full h-full -z-1",
                "transition-[background-image,background-color] duration-1000"
            )}
            style={{ backgroundColor }}
        />
    );
}
