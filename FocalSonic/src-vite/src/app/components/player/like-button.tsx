import { Button } from "@/app/components/ui/button";
import { SimpleTooltip } from "@/app/components/ui/simple-tooltip";
import {
    usePlayerActions,
    usePlayerSongStarred,
    usePlayerStore,
} from "@/store/player.store";
import clsx from "clsx";
import { Star } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

interface PlayerLikeButtonProps {
    disabled: boolean
}

export function PlayerLikeButton({ disabled }: PlayerLikeButtonProps) {
    const { t } = useTranslation();
    const isSongStarred = usePlayerSongStarred();
    const { title: song, artist } = usePlayerStore(
        (state) => state.songlist.currentSong,
    );
    const { starCurrentSong } = usePlayerActions();

    const translationLabel = `player.tooltips.${isSongStarred ? "dislike" : "like"}`;
    const likeTooltip = t(translationLabel, { song, artist });

    return (
        <SimpleTooltip text={likeTooltip}>
            <Button
                variant="ghost"
                className="rounded-full w-10 h-10 p-3 text-secondary-foreground"
                disabled={disabled}
                onClick={starCurrentSong}
                data-testid="player-like-button"
            >
                <Star
                    className={clsx(
                        "w-5 h-5",
                        isSongStarred && "text-yellow-500 fill-yellow-500",
                    )}
                    data-testid="player-like-icon"
                />
            </Button>
        </SimpleTooltip>
    );
}
