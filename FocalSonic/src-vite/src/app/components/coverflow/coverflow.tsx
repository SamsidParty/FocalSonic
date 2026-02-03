import { getCoverArtUrl } from "@/api/httpClient";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/routes/routesList";
import { SingleAlbum } from "@/types/responses/album";
import React from "react";
import { Link } from "react-router-dom";
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
    const {
        currentIndex,
        goToNext,
        goToPrevious,
        goToIndex,
        getVisibleItems,
        containerRef,
    } = useCoverflow({
        items,
        visibleCount,
        initialIndex: Math.floor(items.length / 2),
    });

    if (items.length === 0) {
        return null;
    }

    const visibleItems = getVisibleItems();
    const currentItem = items[currentIndex];
    
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
                        {visibleItems.map(({ item, position, virtualIndex }) => (
                            <CoverflowItemCard
                                key={`${item.id}-${virtualIndex}`}
                                item={item}
                                position={position}
                                isCenter={position === 0}
                                onClick={() => goToIndex(virtualIndex)}
                            />
                        ))}
                    </div>

                    {/* Navigation arrows */}
                    <button
                        onClick={goToPrevious}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-background/50 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-background/70 transition-colors"
                        aria-label="Previous"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={goToNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-background/50 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-background/70 transition-colors"
                        aria-label="Next"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>

                    <div className="absolute bottom-16 left-0 right-0 h-12 x-20">
                        <div className="max-w-2xl mx-auto text-center">
                            {/* Title */}
                            <h2 className="text-2xl font-bold truncate mb-1">
                                {currentItem?.name}
                            </h2>
                    
                            {/* Subtitle with optional link */}
                            {currentItem?.subtitle && (
                                <p className="text-lg text-muted-foreground truncate">
                                    {subtitleLink ? (
                                        <Link 
                                            to={subtitleLink}
                                            className="hover:text-primary hover:underline transition-colors"
                                        >
                                            {currentItem.subtitle}
                                        </Link>
                                    ) : (
                                        currentItem.subtitle
                                    )}
                                </p>
                            )}
                    
                            {/* Progress indicator */}
                            <div className="mt-4 flex items-center justify-center gap-2">
                                <span className="text-sm text-muted-foreground tabular-nums">
                                    {currentIndex + 1}
                                </span>
                                <div className="w-32 h-1 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary rounded-full transition-all duration-300"
                                        style={{
                                            width: `${((currentIndex + 1) / items.length) * 100}%`,
                                        }}
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground tabular-nums">
                                    {items.length}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>


            </div>


            {/* Background blur effect */}
            <div
                className="absolute inset-0 -z-10 scale-110"
                style={{
                    backgroundImage: `url(${getCoverArtUrl(currentItem?.coverArt, "album", "100")})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    filter: "blur(80px) brightness(0.4)",
                    transition: "background-image 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
            />
        </>
    );
}
