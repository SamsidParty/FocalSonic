import { PreviewItemMenuOptions } from "@/app/components/options/preview-item-menu";
import { AppleMusicRecommendationContent } from "@/types/applemusic/recommendations";
import { Albums } from "@/types/responses/album";
import React from "react";
import { PreviewCard } from "../preview-card/card";
import usePreviewCard from "../preview-card/use-preview-card";
import { ChipBadge } from "../ui/badge";

export default function AppleMusicHeroCard({ entry, isLarge, title }: { entry: Albums | AppleMusicRecommendationContent, isLarge: boolean, title?: string }) {

    const { navigateToResource, handlePlay } = usePreviewCard();
    const imageSrc = Object.values(entry?.attributes?.plainEditorialCard || {})?.[0]?.editorialArtwork?.superHeroWide?.url.replace("{w}", "4320").replace("{h}", "1800").replace("{f}", "jpg");

    if (!title) {
        title = Object.values(entry?.attributes?.plainEditorialCard || {})?.[0]?.plainEditorialNotes?.tagline;
    }

    return (
        <PreviewCard.Root contextMenuOptions={<PreviewItemMenuOptions item={entry} variant="context" />}>
            <PreviewCard.ImageWrapper 
                onClick={() => navigateToResource(entry)}
                className="w-full h-auto rounded aspect-auto"
            >
                <img
                    src={imageSrc}
                    alt={title}
                    className="w-full h-auto "
                />
                <PreviewCard.PlayButton
                    onClick={() => handlePlay(entry)}
                />
                {
                    title && (
                        <div className="flex absolute bottom-2 right-2">
                            <ChipBadge text={title || ""} />
                        </div>
                    )
                }
            </PreviewCard.ImageWrapper>
        </PreviewCard.Root>
    );
}