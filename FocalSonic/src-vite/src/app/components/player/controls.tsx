import RepeatOne from "@/app/components/icons/repeat-one";
import { Button } from "@/app/components/ui/button";
import { SimpleTooltip } from "@/app/components/ui/simple-tooltip";
import { usePlayerHotkeys } from "@/app/hooks/use-audio-hotkeys";
import { cn } from "@/lib/utils";
import {
    usePlayerActions,
    usePlayerIsPlaying,
    usePlayerLoop,
    usePlayerMediaType,
    usePlayerPrevAndNext,
    usePlayerShuffle,
} from "@/store/player.store";
import { usePlayerStyle } from "@/store/theme.store";
import { LoopState } from "@/types/playerContext";
import { Radio } from "@/types/responses/radios";
import { ISong } from "@/types/responses/song";
import { manageMediaSession } from "@/utils/setMediaSession";
import clsx from "clsx";
import {
    InfinityIcon,
    Pause,
    Play,
    Repeat,
    Shuffle,
    SkipBack,
    SkipForward,
} from "lucide-react";
import { ComponentPropsWithoutRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

interface PlayerControlsProps {
    song: ISong
    radio: Radio
}

export function PlayerControls({ song, radio }: PlayerControlsProps) {
    const { t } = useTranslation();
    const { isSong } = usePlayerMediaType();
    const isShuffleActive = usePlayerShuffle();
    const { hasPrev, hasNext } = usePlayerPrevAndNext();
    const loopState = usePlayerLoop();
    const isPlaying = usePlayerIsPlaying();
    const {
        isPlayingOneSong,
        toggleShuffle,
        toggleLoop,
        togglePlayPause,
        playPrevSong,
        playNextSong,
    } = usePlayerActions();
    const { useAudioHotkeys } = usePlayerHotkeys();
    const { playerStyle, useSlimButtons } = usePlayerStyle();

    useAudioHotkeys("space", togglePlayPause);
    useAudioHotkeys("mod+left", playPrevSong);
    useAudioHotkeys("mod+right", playNextSong);
    useAudioHotkeys("mod+s", toggleShuffle);
    useAudioHotkeys("mod+t", toggleLoop);

    useEffect(() => {
        manageMediaSession.setHandlers();
    }, [isPlaying]);

    const shuffleTooltip = isShuffleActive
        ? t("player.tooltips.shuffle.disable")
        : t("player.tooltips.shuffle.enable");
    const previousTooltip = t("player.tooltips.previous");
    const nextTooltip = t("player.tooltips.next");
    const playTooltip = isPlaying
        ? t("player.tooltips.pause")
        : t("player.tooltips.play");
    const repeatTooltips = {
        0: t("player.tooltips.repeat.enable"),
        1: t("player.tooltips.repeat.enableOne"),
        2: t("player.tooltips.repeat.disable"),
        3: t("player.tooltips.repeat.infinite"),
    };
    const repeatTooltip = repeatTooltips[loopState];
    const cannotGotoNextSong =
        !hasNext &&
        loopState !== LoopState.All &&
        loopState !== LoopState.InfiniteRadio;
    const disableButtons = !song && !radio;

    return (
        <div className={cn("mb-1 flex items-center justify-center gap-1 xxs:w-fit xxs:gap-0", useSlimButtons ? "gap-0" : "gap-1", playerStyle === "slim" ? "w-fit" : "w-full")}>
            {isSong && (
                <PlayerButton
                    className={clsx(isShuffleActive && "player-button-active")}
                    disabled={!song || isPlayingOneSong() || !hasNext}
                    onClick={toggleShuffle}
                    data-testid="player-button-shuffle"
                    tooltip={shuffleTooltip}
                >
                    <Shuffle
                        className={clsx(
                            isShuffleActive ? "text-primary" : "text-secondary-foreground",
                        )}
                    />
                </PlayerButton>
            )}

            <PlayerButton
                disabled={disableButtons || !hasPrev}
                onClick={playPrevSong}
                data-testid="player-button-prev"
                tooltip={previousTooltip}
            >
                <SkipBack className="fill-secondary-foreground text-secondary-foreground" />
            </PlayerButton>

            <PlayerButton
                variant={useSlimButtons ? "ghost" : "default"}
                disabled={disableButtons}
                onClick={togglePlayPause}
                data-testid={`player-button-${isPlaying ? "pause" : "play"}`}
                className={useSlimButtons ? "size-10 p-2" : undefined}
                tooltip={playTooltip}
            >
                {isPlaying ? (
                    <Pause className={useSlimButtons ? "!h-full !w-full fill-secondary-foreground stroke-secondary-foreground" : "fill-primary-foreground"} />
                ) : (
                    <Play className={useSlimButtons ? "!h-full !w-full fill-secondary-foreground stroke-secondary-foreground" : "fill-primary-foreground"} />
                )}
            </PlayerButton>

            <PlayerButton
                disabled={disableButtons || cannotGotoNextSong}
                onClick={playNextSong}
                data-testid="player-button-next"
                tooltip={nextTooltip}
            >
                <SkipForward className="fill-secondary-foreground text-secondary-foreground" />
            </PlayerButton>

            {isSong && (
                <PlayerButton
                    className={clsx(loopState !== LoopState.Off && "player-button-active")}
                    disabled={!song}
                    onClick={toggleLoop}
                    data-testid="player-button-loop"
                    tooltip={repeatTooltip}
                >
                    {loopState === LoopState.Off && (
                        <Repeat className="text-secondary-foreground" />
                    )}
                    {loopState === LoopState.All && <Repeat className="text-primary" />}
                    {loopState === LoopState.One && (
                        <RepeatOne className="text-primary" />
                    )}
                    {loopState === LoopState.InfiniteRadio && (
                        <InfinityIcon className="text-primary" />
                    )}
                </PlayerButton>
            )}
        </div>
    );
}

type PlayerButtonProps = ComponentPropsWithoutRef<typeof Button> & {
    tooltip: string
}

function PlayerButton({ className, tooltip, ...props }: PlayerButtonProps) {
    const { useSlimButtons } = usePlayerStyle();

    return (
        <SimpleTooltip text={tooltip}>
            <Button
                variant="ghost"
                className={cn(
                    "relative size-10 rounded-full p-0 [&_svg]:pointer-events-none [&_svg]:size-[18px] [&_svg]:shrink-0",
                    useSlimButtons && "size-8 [&_svg]:size-[16px]",
                    className,
                )}
                {...props}
            />
        </SimpleTooltip>
    );
}
