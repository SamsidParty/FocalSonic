import { getCoverArtUrl } from "@/api/httpClient";
import { PreviewCard } from "@/app/components/preview-card/card";
import {
    Carousel,
    type CarouselApi,
    CarouselContent,
    CarouselItem,
} from "@/app/components/ui/carousel";
import { CarouselButton } from "@/app/components/ui/carousel-button";
import { ROUTES } from "@/routes/routesList";
import { service } from "@/service/service";
import { usePlayerActions } from "@/store/player.store";
import { AppleMusicRecommendationContent } from "@/types/applemusic/recommendations";
import { Albums } from "@/types/responses/album";
import { checkServerType } from "@/utils/servers";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

interface PreviewListProps {
    list: Albums[] | AppleMusicRecommendationContent[]
    title: string
    showMore?: boolean
    isLarge: boolean
    moreTitle?: string
    moreRoute?: string
}

export default function PreviewList({
    list,
    title,
    showMore = true,
    moreTitle,
    isLarge,
    moreRoute,
}: PreviewListProps) {
    const [api, setApi] = useState<CarouselApi>();
    const [canScrollPrev, setCanScrollPrev] = useState<boolean>();
    const [canScrollNext, setCanScrollNext] = useState<boolean>();
    const { setSongList, setPlayAppleMusicRadio } = usePlayerActions();
    const { t } = useTranslation();
    const { isAppleMusic } = checkServerType();
    const navigate = useNavigate();
    const { setPlayRadio } = usePlayerActions();

    moreTitle = moreTitle || t("generic.seeMore");

    if (list.length > 16) {
        list = list.slice(0, 16);
    }

    async function handlePlay(entry: AppleMusicRecommendationContent | Albums) {
        
        if (entry.type === "stations") {
            // Apple music radio
            setPlayAppleMusicRadio(entry);
            return;
        }

        const response = await service.albums.getOne(entry.id);

        if (response) {
            setSongList(response.song, 0);
        }
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

    const getResourceType = (entry: AppleMusicRecommendationContent | Albums) => {
        const type = (entry as AppleMusicRecommendationContent).type;
        return type?.slice(0, -1).toUpperCase().replace("LIBRARY-", "") || "ALBUM";
    };

    const navigateToResource = (entry: AppleMusicRecommendationContent | Albums) => {

        if (entry.type === "stations") {
            handlePlay(entry); 
            return;
        }

        const route = ROUTES[getResourceType(entry)]?.PAGE(entry.id);

        if (route) {
            navigate(route);
        }
    };

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
                    <div className="flex gap-2">
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
                        {list.map((entry, index) => (
                            <CarouselItem
                                key={entry.id}
                                className={isLarge ? "basis-1/4 2xl:basis-1/6 " : "basis-1/6 2xl:basis-1/8"}
                                data-testid={`preview-list-carousel-item-${index}`}
                            >
                                <PreviewCard.Root>
                                    <PreviewCard.ImageWrapper 
                                        onClick={() => navigateToResource(entry)}
                                        className={isLarge && "rounded-b-none rounded-t"}
                                    >
                                        <PreviewCard.Image
                                            src={getCoverArtUrl(entry.coverArt || (entry as AppleMusicRecommendationContent).attributes?.artwork?.url, "album")}
                                            alt={title}
                                        />
                                        <PreviewCard.PlayButton
                                            onClick={() => handlePlay(entry)}
                                        />
                                    </PreviewCard.ImageWrapper>
                                    <PreviewCard.InfoWrapper
                                        className={(isLarge && isAppleMusic) && "min-h-16 max-h-16 flex-col rounded-b overflow-hidden"}
                                        style={(isLarge && isAppleMusic) ? {
                                            backgroundImage: "url('" + getCoverArtUrl((entry as AppleMusicRecommendationContent).attributes?.artwork?.url) + "')",
                                            backgroundPosition: "bottom",
                                            color: "#" + (entry as AppleMusicRecommendationContent).attributes?.artwork?.textColor1
                                        } : {}}
                                    >
                                        <div className={(isLarge && isAppleMusic) && "backdrop-blur-3xl px-4 grow text-center flex flex-col justify-center align-center"}>
                                            <PreviewCard.Title onClick={() => navigateToResource(entry)}>
                                                {entry.name || (entry as AppleMusicRecommendationContent).attributes.name}
                                            </PreviewCard.Title>
                                            <PreviewCard.Subtitle
                                                enableLink={(entry.relationships?.artists.data[0]?.id || entry.artistId) !== undefined}
                                                link={ROUTES.ARTIST.PAGE(entry.relationships?.artists.data[0]?.id || entry.artistId)}
                                            >
                                                {entry.artist || (entry as AppleMusicRecommendationContent).attributes.artistName || (entry as AppleMusicRecommendationContent).attributes.curatorName}
                                            </PreviewCard.Subtitle>
                                        </div>
                                    </PreviewCard.InfoWrapper>
                                </PreviewCard.Root>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
            </div>
        </div>
    );
}
