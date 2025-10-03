import { Slider } from "@/app/components/ui/slider";
import { usePlayerHotkeys } from "@/app/hooks/use-audio-hotkeys";
import { cn } from "@/lib/utils";
import { usePlayerSpeed, useSpeedSettings } from "@/store/player.store";
import clsx from "clsx";
import { Gauge } from "lucide-react";
import React from "react";
import {
    ComponentPropsWithoutRef,
    RefObject,
    useEffect
} from "react";
import { useTranslation } from "react-i18next";
import { PopoverSpeed } from "./popover-speed";

interface PlayerSpeedProps {
    disabled: boolean
    audioRef: RefObject<HTMLAudioElement>
}

export function PlayerSpeed({ disabled, audioRef }: PlayerSpeedProps) {
    const { t } = useTranslation();
    const { speed } = usePlayerSpeed();
    const { useAudioHotkeys } = usePlayerHotkeys();

    useEffect(() => {
        if (!audioRef.current) return;
        audioRef.current.playbackRate = speed;
        audioRef.current.preservesPitch = false;
    }, [audioRef, speed]);

    return (
        <div className={clsx(disabled && "opacity-50")}>
            <div className="flex 2xl:hidden">
                <PopoverSpeed>
                    <Gauge size={18} />
                </PopoverSpeed>
            </div>

            <div className="hidden 2xl:flex gap-2 pr-2 items-center">
                <SpeedSlider disabled={disabled} />
            </div>
        </div>
    );
}


type SpeedSliderProps = ComponentPropsWithoutRef<typeof Slider>

export function SpeedSlider({
    disabled,
    className,
    ...props
}: SpeedSliderProps) {
    const { speed, setSpeed } = usePlayerSpeed();
    const { min, max, step } = useSpeedSettings();


    return (
        <Slider
            className={cn(
                "cursor-pointer w-32",
                className,
                disabled && "pointer-events-none opacity-50",
            )}
            data-testid="player-Speed-slider"
            tooltipValue={speed.toString()}
            {...props}
            value={[speed]}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            onValueChange={([value]) => setSpeed(value)}
        />
    );
}
