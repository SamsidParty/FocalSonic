import { Button } from "@/app/components/ui/button";
import { SimpleTooltip } from "@/app/components/ui/simple-tooltip";
import { useLyricsState, useMainDrawerState } from "@/store/player.store";
import clsx from "clsx";
import { QuoteIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

interface PlayerLyricsButtonProps {
    disabled?: boolean
}

export function PlayerLyricsButton({ disabled }: PlayerLyricsButtonProps) {
    const { t } = useTranslation();
    const { mainDrawerState } = useMainDrawerState();
    const { lyricsState, toggleLyricsAction } = useLyricsState();

    const isActive = lyricsState;

    function handleClick() {
        toggleLyricsAction();
    }

    return (
        <SimpleTooltip text={t("fullscreen.lyrics")}>
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
                <QuoteIcon className={clsx("w-4 h-4", isActive && "text-primary")} />
            </Button>
        </SimpleTooltip>
    );
}
