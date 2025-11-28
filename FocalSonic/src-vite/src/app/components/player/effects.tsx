import clsx from "clsx";
import { AudioWaveform } from "lucide-react";
import React, {
    RefObject
} from "react";

import { useAppSettings } from "@/store/app.store";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";

interface PlayerSpeedProps {
    disabled: boolean
    audioRef: RefObject<HTMLAudioElement>
}

export function PlayerEffects({ disabled, audioRef }: PlayerSpeedProps) {
    const { t } = useTranslation();
    const { extraBarContent, setExtraBarContent } = useAppSettings();

    const isActive = extraBarContent === "effects";

    const handleClick = () => {
        setExtraBarContent(extraBarContent === "effects" ? "none" : "effects");
    };

    return (
        <div className={clsx(disabled && "opacity-50")}>
            <div className="flex">
                <Button
                    variant="ghost"
                    size="icon"
                    className={clsx(
                        "rounded-full w-10 h-10 p-2 text-secondary-foreground relative",
                        isActive && "player-button-active",
                    )}
                    onClick={handleClick}
                    disabled={disabled}
                >
                    <AudioWaveform className={clsx("w-4 h-4", isActive && "text-primary")} />
                </Button>
            </div>
        </div>
    );
}