import { getCoverArtUrl } from "@/api/httpClient";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/routes/routesList";
import { useTheme } from "@/store/theme.store";
import { SingleAlbum } from "@/types/responses/album";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";
import { Button } from "../ui/button";
import { CoverflowItemCard } from "./coverflow-item";
import { useCoverflow } from "./use-coverflow";

interface CoverflowProps {
    items: SingleAlbum[];
    className?: string;
    visibleCount?: number;
}

export default function Coverflow({
    items,
    className,
    visibleCount = 20,
}: CoverflowProps) {

    let effectiveItems = items;
    if (items.length <= visibleCount) {
        // Fill and wrap to visibleCount
        effectiveItems = [];
        for (let i = 0; i < visibleCount + 1; i++) {
            effectiveItems.push(JSON.parse(JSON.stringify(items[i % items.length])));
        }
    }

    const { coverflowStyle } = useTheme();

    const {
        currentIndex,
        goToNext,
        goToPrevious,
        goToIndex,
        getVisibleItems,
        containerRef,
    } = useCoverflow({
        items: effectiveItems,
        visibleCount,
        initialIndex: Math.floor(effectiveItems.length / 2),
    });

    if (effectiveItems.length === 0) {
        return null;
    }

    const visibleItems = getVisibleItems();
    const currentItem = effectiveItems[currentIndex];
    
    // Get subtitle link based on item type
    const getSubtitleLink = () => {
        if (!currentItem?.subtitleId) return null;
        switch (currentItem.type) {
            case "album":
            case "song":
                return ROUTES.ARTIST.PAGE(currentItem.subtitleId);
            default:
                return null;
        }
    };

    const subtitleLink = getSubtitleLink();

    return (
        <>
            <div className={cn("flex flex-col w-full h-full", className)}>
                {/* Main coverflow container */}
                <div
                    ref={containerRef}
                    className="relative flex-1 w-full overflow-hidden"
                    style={{ perspective: "1200px" }}
                    tabIndex={0}
                    role="listbox"
                    aria-label="Coverflow gallery"
                >
                
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/60 via-transparent to-background" />
                
                    {/* 3D Stage */}
                    <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{
                            transformStyle: "preserve-3d",
                        }}
                    >
                        {visibleItems.map(({ item, position, virtualIndex }, i) => (
                            <CoverflowItemCard
                                key={`${virtualIndex}`}
                                item={item}
                                position={position}
                                isCenter={position === 0}
                                onClick={() => goToIndex(virtualIndex)}
                            />
                        ))}
                    </div>

                    {/* Navigation arrows */}
                    <Button
                        className="p-2 transition-all duration-300 hover:scale-110 rounded-full absolute left-4 top-1/2 -translate-y-1/2 z-50 w-10 h-10"
                        variant="secondary"
                        onClick={goToPrevious}
                        data-testid="card-play-button"
                    >
                        <ChevronLeft className="w-full h-full" />
                    </Button>
                    <Button
                        className="p-2 transition-all duration-300 hover:scale-110 rounded-full absolute right-4 top-1/2 -translate-y-1/2 z-50 w-10 h-10"
                        variant="secondary"
                        onClick={goToNext}
                        data-testid="card-play-button"
                    >
                        <ChevronRight className="w-full h-full" />
                    </Button>

                    <div className="absolute bottom-[4%] left-0 right-0 h-12 x-20">
                        <div className="max-w-2xl mx-auto text-center">
                            {/* Title */}
                            <h2 className="text-2xl font-bold truncate mb-1">
                                {currentItem?.name}
                            </h2>
                        </div>
                    </div>
                </div>


            </div>

            {
                coverflowStyle === "modern" && ( // Modern background (centered blur)
                    <div
                        className="absolute w-[40%] h-[60%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 scale-110 opacity-40"
                        style={{
                            backgroundImage: `url(${getCoverArtUrl(currentItem?.coverArt, "album", "800")})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            filter: "blur(80px) brightness(110%) saturate(500%)",
                            transition: "background-image 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                            borderRadius: "50%",
                        }}
                    />
                )
            }

            {
                coverflowStyle === "classic" && ( // Classic background (fullscreen blur)
                    <div
                        className="absolute inset-0 -z-10 scale-110 opacity-40"
                        style={{
                            backgroundImage: `url(${getCoverArtUrl(currentItem?.coverArt, "album", "800")})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            filter: "blur(80px)",
                            transition: "background-image 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                        }}
                    />
                )
            }
            
        </>
    );
}
