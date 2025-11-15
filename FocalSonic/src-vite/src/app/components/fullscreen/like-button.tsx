import { Button } from "@/app/components/ui/button";
import { usePlayerActions, usePlayerSongStarred } from "@/store/player.store";
import { clsx } from "clsx";
import { buttonsStyle } from "./controls";
import { Star } from "lucide-react";
import React from "react";

export function LikeButton() {
    const { starCurrentSong } = usePlayerActions();
    const isSongStarred = usePlayerSongStarred();

    return (
        <Button
            size="icon"
            variant="ghost"
            className={buttonsStyle.secondary}
            onClick={starCurrentSong}
            style={{ ...buttonsStyle.style }}
        >
            <Star
                className={clsx(
                    "w-6 h-6 drop-shadow-lg",
                    isSongStarred && "text-yellow-500 fill-yellow-500",
                )}
            />
        </Button>
    );
}
