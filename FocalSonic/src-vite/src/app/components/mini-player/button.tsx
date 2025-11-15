import { Button } from "@/app/components/ui/button";
import { SimpleTooltip } from "@/app/components/ui/simple-tooltip";
import { useMainDrawerState, usePlayerCurrentList } from "@/store/player.store";
import { usePlayerStyle } from "@/store/theme.store";
import clsx from "clsx";
import { PictureInPicture2Icon } from "lucide-react";
import React, { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { MiniPlayer } from "./player";
import { MiniPlayerPortal } from "./portal";

const MemoMiniPlayerPortal = memo(MiniPlayerPortal);
const MemoMiniPlayer = memo(MiniPlayer);

export function MiniPlayerButton() {
    const { t } = useTranslation();
    const currentList = usePlayerCurrentList();
    const { isMiniPlayer } = usePlayerStyle();
    const { setMainDrawerState } = useMainDrawerState();

    const handleClick = useCallback(async () => {
        if (isMiniPlayer) {
            window.igniteView?.commandBridge?.exitMiniPlayer();
        } else {
            window.igniteView?.commandBridge?.enterMiniPlayer();
            setMainDrawerState(true);
        }
    }, [isMiniPlayer]);


    const disabled = currentList.length === 0;

    const buttonTooltip = isMiniPlayer
        ? t("player.tooltips.miniPlayer.close")
        : t("player.tooltips.miniPlayer.open");

    return (
        <>
            <SimpleTooltip text={buttonTooltip}>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClick}
                    className={clsx(
                        "relative rounded-full",
                        isMiniPlayer && "text-primary hover:text-primary player-button-active",
                    )}
                    onFocus={(e) => e.preventDefault()}
                    disabled={disabled}
                >
                    <PictureInPicture2Icon className="w-4 h-4" />
                </Button>
            </SimpleTooltip>
        </>
    );
}
