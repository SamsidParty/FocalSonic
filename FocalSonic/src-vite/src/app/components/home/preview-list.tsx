import { getCoverArtUrl } from "@/api/httpClient";
import {
    hasPreviewItemMenuOptions,
    PreviewItemMenuOptions,
} from "@/app/components/options/preview-item-menu";
import { PreviewCard } from "@/app/components/preview-card/card";
import {
    Carousel,
    type CarouselApi,
    CarouselContent,
    CarouselItem,
} from "@/app/components/ui/carousel";
import { CarouselButton } from "@/app/components/ui/carousel-button";
import { ROUTES } from "@/routes/routesList";
import { AppleMusicRecommendationContent } from "@/types/applemusic/recommendations";
import { Albums } from "@/types/responses/album";
import { checkServerType } from "@/utils/servers";
import useAverageColor from "@/utils/useAverageColor";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import usePreviewCard from "../preview-card/use-preview-card";
import { ChipBadge } from "../ui/badge";
import AppleMusicHeroCard from "./apple-music-hero-card";

interface PreviewListProps {
    list: Albums[] | AppleMusicRecommendationContent[]
    title: string
    showMore?: boolean
    stagger?: number
    isLarge: boolean
    appleMusic?: {
        attributes?: {
            display?: {
                kind?: string
            }
        }
    }
    moreTitle?: string
    moreRoute?: string
}

export default function PreviewList({
    list,
    title,
    showMore = true,
    moreTitle,
    appleMusic,
    isLarge,
    stagger,
    moreRoute,
}: PreviewListProps) {
    const [api, setApi] = useState<CarouselApi>();
    const [canScrollPrev, setCanScrollPrev] = useState<boolean>();
    const [canScrollNext, setCanScrollNext] = useState<boolean>();
    const { t } = useTranslation();


    moreTitle = moreTitle || t("generic.seeMore");

    if (list?.length > 16) {
        list = list.slice(0, 16);
    }


    useEffect(() => {
        if (!api) {
            return;
        }

        setCanScrollPrev(api.canScrollPrev());
        setCanScrollNext(api.canScrollNext());

        api.on("select", () => {
            setCanScrollPrev(api.canScrollPrev());
            setCanScrollNext(api.canScrollNext());
        });
    }, [api]);

 
    if (list?.length === 0 || !list) {
        return;
    }

    return (
        <div className="w-full flex flex-col mt-4">
            <div className="my-4 flex justify-between items-center">
                <h3
                    className="scroll-m-20 text-2xl font-semibold tracking-tight"
                    data-testid="preview-list-title"
                >
                    {title}
                </h3>
                <div className="flex items-center gap-4">
                    {showMore && moreRoute && (
                        <Link to={moreRoute} data-testid="preview-list-show-more">
                            <p className="leading-7 text-sm truncate hover:underline text-muted-foreground hover:text-primary">
                                {moreTitle}
                            </p>
                        </Link>
                    )}
                    <div className="flex">
                        <CarouselButton
                            direction="prev"
                            disabled={!canScrollPrev}
                            onClick={() => api?.scrollPrev()}
                            data-testid="preview-list-prev-button"
                        />
                        <CarouselButton
                            direction="next"
                            disabled={!canScrollNext}
                            onClick={() => api?.scrollNext()}
                            data-testid="preview-list-next-button"
                        />
                    </div>
                </div>
            </div>


            <div className="transform-gpu">
                <Carousel
                    opts={{
                        align: "start",
                        slidesToScroll: "auto",
                    }}
                    setApi={setApi}
                    data-testid="preview-list-carousel"
                >
                    <CarouselContent>
                        {list.map((entry, index) => {

                            let CardType = RegularPreviewCard;
                            let className = isLarge ? "basis-1/4 2xl:basis-1/6 " : "basis-1/6 2xl:basis-1/8";

                            if (appleMusic?.attributes?.display?.kind == "MusicSuperHeroShelf" && Object.values(entry?.attributes?.plainEditorialCard || {})?.[0]?.editorialArtwork?.superHeroWide?.url) {
                                CardType = AppleMusicHeroCard;
                                className = "basis-full";
                            }

                            return (
                                <CarouselItem
                                    key={entry.id}
                                    className={className}
                                    data-testid={`preview-list-carousel-item-${index}`}
                                >
                                    <CardType entry={entry} isLarge={isLarge} stagger={(stagger || 0) + index}  />
                                </CarouselItem>
                            );
                        })}
                    </CarouselContent>
                </Carousel>
            </div>
        </div>
    );
}


export function RegularPreviewCard({ entry, isLarge, title, stagger }: { entry: Albums | AppleMusicRecommendationContent, isLarge: boolean, title?: string, stagger?: number }) {

    const { handlePlay, navigateToResource } = usePreviewCard();
    const { isAppleMusic } = checkServerType();
    const contextMenuOptions = hasPreviewItemMenuOptions(entry)
        ? <PreviewItemMenuOptions item={entry} variant="context" />
        : undefined;

        
    const getPreviewImage = () => (entry.coverArt || entry?.attributes?.artwork?.url || entry?.attributes?.editorialArtwork?.brandLogo?.url);

    const [imageForAverageColor, setImageForAverageColor] = useState<string | null>(null);
    const imageAverageColor = useAverageColor(imageForAverageColor, "Muted");

    const getLargePreviewColor = () => {
        let val = "0000003a";

        val = imageAverageColor || val;
        val = entry?.attributes?.editorialVideo?.motionDetailSquare?.previewFrame?.bgColor || val;
        val = entry?.attributes?.artwork?.bgColor || val;

        if (val === "0000003a" && !imageAverageColor) {
            // Fallback to average color if apple doesn't provide a bg color
            setTimeout(() => {
                setImageForAverageColor(getCoverArtUrl(getPreviewImage(), "album", "20"));
            }, 0);
        }

        return !val.startsWith("#") ? `#${val}` : val;
    };

    return (
        <PreviewCard.Root 
            contextMenuOptions={contextMenuOptions}
            style={{
                animationDelay: stagger ? `${stagger * 50}ms` : undefined,
                animationName: stagger ? "cardStaggerAnimation" : undefined,
                animationDuration: "1000ms",
                animationFillMode: "both",
                animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)"
            }}
        >
            <PreviewCard.ImageWrapper 
                onClick={() => navigateToResource(entry)}
                className={isLarge && "rounded-b-none rounded-t"}
            >
                <PreviewCard.Image
                    src={getCoverArtUrl(getPreviewImage(), "album")}
                    alt={title}
                />
                <PreviewCard.PlayButton
                    onClick={() => handlePlay(entry)}
                />
                {
                    title && (
                        <div className="flex absolute top-2 left-2">
                            <ChipBadge text={title || ""} />
                        </div>
                    )
                }
            </PreviewCard.ImageWrapper>
            <PreviewCard.InfoWrapper
                className={(isLarge && isAppleMusic) && "min-h-16 max-h-16 flex-col rounded-b overflow-hidden transition-all duration-300"}
                style={(isLarge && isAppleMusic) ? {
                    backgroundColor: getLargePreviewColor(),
                    backgroundPosition: "bottom",
                    color: "white"
                } : {}}
            >
                <div className={(isLarge && isAppleMusic) && "backdrop-brightness-[80%] px-4 grow text-center flex flex-col rounded-b-sm overflow-hidden justify-center align-center"}>
                    <PreviewCard.Title className={isLarge ? "justify-center" : ""} entry={entry} onClick={() => navigateToResource(entry)}/>
                    <PreviewCard.Subtitle
                        enableLink={(entry.relationships?.artists?.data[0]?.id || entry.artistId) !== undefined}
                        link={ROUTES.ARTIST.PAGE(entry.relationships?.artists?.data[0]?.id || entry.artistId)}
                    >
                        {entry.artist || entry?.attributes?.artistName || entry?.attributes?.curatorName || entry?.attributes?.editorialNotes?.tagline || entry?.attributes?.plainEditorialNotes?.tagline}
                    </PreviewCard.Subtitle>
                </div>
            </PreviewCard.InfoWrapper>
        </PreviewCard.Root>
    );

}