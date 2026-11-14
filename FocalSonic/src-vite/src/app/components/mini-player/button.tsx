import { Button } from "@/app/components/ui/button";
import { SimpleTooltip } from "@/app/components/ui/simple-tooltip";
import { usePlayerCurrentList } from "@/store/player.store";
import { useWindowMode } from "@/store/window.store";
import clsx from "clsx";
import { PictureInPicture2Icon } from "lucide-react";
import { useTranslation } from "react-i18next";

export function MiniPlayerButton() {
    const { t } = useTranslation();
    const currentList = usePlayerCurrentList();
    const { isMiniPlayer, toggleMiniPlayer } = useWindowMode();

    const disabled = currentList.length === 0;

    const buttonTooltip = isMiniPlayer
        ? t("player.tooltips.miniPlayer.close")
        : t("player.tooltips.miniPlayer.open");

    return (
        <SimpleTooltip text={buttonTooltip}>
            <Button
                variant="ghost"
                size="icon"
                onClick={toggleMiniPlayer}
                className={clsx(
                    "relative rounded-full hide-in-fullscreen",
                    isMiniPlayer && "text-primary hover:text-primary player-button-active",
                )}
                onFocus={(e) => e.preventDefault()}
                disabled={disabled}
            >
                <PictureInPicture2Icon className="w-4 h-4" />
            </Button>
        </SimpleTooltip>
    );
}
