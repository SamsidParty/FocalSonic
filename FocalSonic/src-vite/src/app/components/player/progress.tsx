import { ProgressSlider } from "@/app/components/ui/slider";
import {
    usePlayerActions,
    usePlayerDuration,
    usePlayerIsPlaying,
    usePlayerProgress,
    usePlayerSonglist,
} from "@/store/player.store";
import { usePlayerStyle } from "@/store/theme.store";
import { convertSecondsToTime } from "@/utils/convertSecondsToTime";
import clsx from "clsx";
import {
    RefObject,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

interface PlayerProgressProps {
    audioRef: RefObject<HTMLAudioElement>
}

let isSeeking = false;

export function PlayerProgress({ audioRef }: PlayerProgressProps) {
    const progress = usePlayerProgress();
    const [localProgress, setLocalProgress] = useState(progress);
    const currentDuration = usePlayerDuration();
    const isPlaying = usePlayerIsPlaying();
    const { currentSong, currentList } = usePlayerSonglist();
    const { setProgress } = usePlayerActions();
    const isScrobbleSentRef = useRef(false);

    const isEmpty = currentList.length === 0;

    const updateAudioCurrentTime = useCallback(
        (value: number) => {
            isSeeking = false;
            if (audioRef.current) {
                audioRef.current.currentTime = value;
            }
        },
        [audioRef],
    );

    const handleSeeking = useCallback((amount: number) => {
        isSeeking = true;
        setLocalProgress(amount);
    }, []);

    const handleSeeked = useCallback(
        (amount: number) => {
            updateAudioCurrentTime(amount);
            setProgress(amount);
            setLocalProgress(amount);
        },
        [setProgress, updateAudioCurrentTime],
    );

    const handleSeekedFallback = useCallback(() => {
        if (localProgress !== progress) {
            updateAudioCurrentTime(localProgress);
            setProgress(localProgress);
        }
    }, [localProgress, progress, setProgress, updateAudioCurrentTime]);

    const songDuration = useMemo(
        () => convertSecondsToTime(currentDuration ?? 0),
        [currentDuration],
    );

    const progressTicks = useRef(0);

    useEffect(() => {
        if (isSeeking || !isPlaying) {
            return;
        }

        const progressPercentage = (progress / currentDuration) * 100;

        if (progressPercentage === 0) {
            isScrobbleSentRef.current = false;
            progressTicks.current = 0;
        } else {
            progressTicks.current += 1;

            if (
                (progressTicks.current >= currentDuration / 2 ||
                    progressTicks.current >= 60 * 4) &&
                !isScrobbleSentRef.current
            ) {
                isScrobbleSentRef.current = true;
            }
        }
    }, [
        progress,
        currentDuration,
        currentSong.id,
        isPlaying,
    ]);

    const currentTime = convertSecondsToTime(isSeeking ? localProgress : progress);

    const isProgressLarge = useMemo(() => {
        return localProgress >= 3600 || progress >= 3600;
    }, [localProgress, progress]);

    const isDurationLarge = useMemo(() => {
        return currentDuration >= 3600;
    }, [currentDuration]);

    const { useSlimButtons, playerStyle } = usePlayerStyle();

    return (
        <div
            className={clsx(
                "flex xxs:w-40 justify-center items-center gap-2",
                playerStyle === "floating" && "absolute bottom-0 left-0 right-0 mx-8 -mb-1",
                playerStyle !== "floating" && "w-full",
                isEmpty && "opacity-50",
            )}
        >
            <small
                className={clsx(
                    "text-xs text-muted-foreground text-right xxs:hidden",
                    useSlimButtons && "hidden",
                    isProgressLarge ? "min-w-14" : "min-w-10",
                )}
                data-testid="player-current-time"
            >
                {currentTime}
            </small>
            {!isEmpty ? (
                <ProgressSlider
                    defaultValue={[0]}
                    value={isSeeking ? [localProgress] : [progress]}
                    isLoading={audioRef.current?.readyState === 0}
                    tooltipTransformer={convertSecondsToTime}
                    max={currentDuration}
                    step={1}
                    className="cursor-pointer w-full"
                    onValueChange={([value]) => handleSeeking(value)}
                    onValueCommit={([value]) => handleSeeked(value)}
                    // Sometimes onValueCommit doesn't work properly
                    // so we also have to set the value on pointer/mouse up events
                    // see https://github.com/radix-ui/primitives/issues/1760
                    onPointerUp={handleSeekedFallback}
                    onMouseUp={handleSeekedFallback}
                    data-testid="player-progress-slider"
                />
            ) : (
                <ProgressSlider
                    defaultValue={[0]}
                    max={100}
                    step={1}
                    disabled={true}
                    className="cursor-pointer w-full pointer-events-none"
                />
            )}
            <small
                className={clsx(
                    "text-xs text-muted-foreground text-left",
                    useSlimButtons && "hidden",
                    isDurationLarge ? "min-w-14" : "min-w-10",
                )}
                data-testid="player-duration-time"
            >
                {songDuration}
            </small>
        </div>
    );
}
