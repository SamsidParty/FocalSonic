import { getCoverArtUrl } from "@/api/httpClient";
import { cn } from "@/lib/utils";
import { AppleMusicRecommendationContent } from "@/types/applemusic/recommendations";
import { Albums } from "@/types/responses/album";
import { title } from "process";
import React from "react";
import { PreviewCard } from "./card";
import usePreviewCard from "./use-preview-card";

interface WidePreviewProps {
    entry: Albums | AppleMusicRecommendationContent,
    className?: string,
}

export function WidePreview({ entry, className }: WidePreviewProps) {

    const { handlePlay, navigateToResource } = usePreviewCard();

    return (
        <PreviewCard.Root className={cn("h-32 w-full p-2 gap-2 flex items-center bg-card box-content rounded-lg shadow-sm", className)}>

            <div className="w-32 h-auto flex-shrink-0">
                <PreviewCard.ImageWrapper 
                    onClick={() => navigateToResource(entry)}
                    className={"rounded"}
                >
                    <PreviewCard.Image
                        src={getCoverArtUrl(entry.coverArt || entry.attributes?.artwork?.url || entry.attributes?.editorialArtwork?.brandLogo?.url, "album")}
                        alt={title}
                    />
                    <PreviewCard.PlayButton
                        onClick={() => handlePlay(entry)}
                    />
                </PreviewCard.ImageWrapper>
                
            </div>
            <div className="w-full h-full flex flex-row">
                <PreviewCard.Title entry={entry} onClick={() => navigateToResource(entry)}/>
            </div>

        </PreviewCard.Root>
    );
}