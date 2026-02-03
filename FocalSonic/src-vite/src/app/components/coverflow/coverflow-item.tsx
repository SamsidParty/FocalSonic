import { getCoverArtUrl } from "@/api/httpClient";
import { cn } from "@/lib/utils";
import { usePlayerActions } from "@/store/player.store";
import { SingleAlbum } from "@/types/responses/album";
import { Play } from "lucide-react";
import React, { memo } from "react";
import { useNavigate } from "react-router-dom";
import CoverArtImage from "../cover-art";
import usePreviewCard from "../preview-card/use-preview-card";
import { Button } from "../ui/button";

interface CoverflowItemCardProps {
    item: SingleAlbum;
    position: number;
    isCenter: boolean;
    onClick: () => void;
}

function CoverflowItemCardComponent({
    item,
    position,
    isCenter,
    onClick,
}: CoverflowItemCardProps) {
    const navigate = useNavigate();
    const { setSongList } = usePlayerActions();
    const { handlePlay, navigateToResource } = usePreviewCard();

    // Calculate 3D transforms based on position
    const absPosition = Math.abs(position);
    const isLeft = position < 0;
    
    // Transform calculations for coverflow effect
    const rotateY = isCenter ? 0 : isLeft ? 45 : -45;
    const translateX = position * 180;
    const translateZ = isCenter ? 100 : -absPosition * 50 - 100;
    const scale = isCenter ? 1 : Math.max(0.7 - absPosition * 0.05, 0.5);
    const opacity = isCenter ? 1 : Math.max(1 - absPosition * 0.15, 0.4);
    const zIndex = 100 - absPosition;


    const handleClick = () => {
        if (isCenter) {
            navigateToResource(item);
        } else {
            onClick();
        }
    };

    const handleDoubleClick = () => {
        if (isCenter) {
            handlePlay(item);
        }
    };

    const coverArtType = item.type === "artist" ? "artist" : "album";

    return (
        <div
            className="absolute left-1/2 top-1/2"
            style={{
                transform: `translate(-50%, -50%) translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                opacity,
                zIndex,
                transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
        >
            <div
                className={cn(
                    "relative w-[280px] h-[280px] rounded-lg overflow-hidden",
                    "shadow-2xl shadow-black/40",
                    "ring-1 ring-white/10 transform-gpu",
                )}
            >
                {/* Cover Art */}
                <CoverArtImage
                    src={getCoverArtUrl(item.coverArt, coverArtType, "800")}
                    alt={item.name}
                    className="absolute inset-0 w-full h-full object-cover"
                />
                
                {/* Reflection gradient overlay for non-center items */}
                {!isCenter && (
                    <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
                )}
                
                {/* Hover overlay for center item */}
                {isCenter && (
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors duration-200 flex items-end p-4 group">
                        <Button
                            className="opacity-0 p-2 group-hover:opacity-75 transition-all duration-300 rounded-full w-10 h-10 z-20"
                            variant="secondary"
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handlePlay(item);
                            }}
                            data-testid="card-play-button"
                        >
                            <Play className="fill-foreground hover:scale-125 transition-transform duration-300" />
                        </Button>
                    </div>
                )}
            </div>
            
            {/* Reflection */}
            <div
                className="absolute left-0 right-0 -bottom-[140px] h-[140px] rounded-xl overflow-hidden pointer-events-none"
                style={{
                    transform: "scaleY(-1)",
                    maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 50%)",
                    WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 50%)",
                }}
            >
                <CoverArtImage
                    src={getCoverArtUrl(item.coverArt, coverArtType, "800")}
                    alt=""
                    className="w-full h-[280px] object-cover blur-[2px]"
                />
            </div>
        </div>
    );
}

export const CoverflowItemCard = memo(CoverflowItemCardComponent);
