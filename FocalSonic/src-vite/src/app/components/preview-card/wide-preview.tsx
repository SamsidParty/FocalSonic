import { getCoverArtUrl } from "@/api/httpClient";
import { cn } from "@/lib/utils";
import { AppleMusicRecommendationContent } from "@/types/applemusic/recommendations";
import { Albums } from "@/types/responses/album";
import React from "react";
import { ChipBadge } from "../ui/badge";
import { PreviewCard } from "./card";
import usePreviewCard from "./use-preview-card";

interface WidePreviewProps {
    entry: Albums | AppleMusicRecommendationContent,
    className?: string,
    title?: string,
}

export function WidePreview({ entry, className, title }: WidePreviewProps) {

    const { handlePlay, navigateToResource } = usePreviewCard();

    return (
        <PreviewCard.Root className={cn("h-40 w-96 p-2 gap-2 flex items-center bg-card box-content rounded-lg shadow-sm", className)}>

            <div className="w-40 h-auto flex-shrink-0">
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
            <div className="w-full h-full flex flex-col">
                <div className="flex">
                    <ChipBadge text={title || ""} />
                </div>
                <PreviewCard.Title entry={entry} onClick={() => navigateToResource(entry)}/>
            </div>

        </PreviewCard.Root>
    );
}