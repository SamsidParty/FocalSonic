import { getCoverArtUrl } from "@/api/httpClient";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/routes/routesList";
import { service } from "@/service/service";
import { usePlayerActions } from "@/store/player.store";
import { SingleAlbum } from "@/types/responses/album";
import React, { memo } from "react";
import { useNavigate } from "react-router-dom";
import CoverArtImage from "../cover-art";

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

    const handleNavigate = () => {
        switch (item.type) {
            case "album":
                navigate(ROUTES.ALBUM.PAGE(item.id));
                break;
            case "artist":
                navigate(ROUTES.ARTIST.PAGE(item.id));
                break;
            case "playlist":
                navigate(ROUTES.PLAYLIST.PAGE(item.id));
                break;
            case "song":
                navigate(ROUTES.ALBUM.PAGE(item.original.albumId || item.original.parent));
                break;
        }
    };

    const handlePlay = async () => {
        switch (item.type) {
            case "album": {
                const response = await service.albums.getOne(item.id);
                if (response) {
                    setSongList(response.song, 0);
                }
                break;
            }
            case "playlist": {
                const response = await service.playlists.getOne(item.id);
                if (response) {
                    setSongList(response.entry, 0);
                }
                break;
            }
            case "song": {
                const response = await service.albums.getOne(item.original.albumId || item.original.parent);
                if (response) {
                    const songIndex = response.song.findIndex(s => s.id === item.id);
                    setSongList(response.song, Math.max(songIndex, 0));
                }
                break;
            }
            case "artist": {
                // For artists, navigate to their page
                handleNavigate();
                break;
            }
        }
    };

    const handleClick = () => {
        if (isCenter) {
            handleNavigate();
        } else {
            onClick();
        }
    };

    const handleDoubleClick = () => {
        if (isCenter) {
            handlePlay();
        }
    };

    const coverArtType = item.type === "artist" ? "artist" : "album";

    return (
        <div
            className="absolute left-1/2 top-1/2 cursor-pointer"
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
                    "relative w-[280px] h-[280px] rounded-xl overflow-hidden",
                    "shadow-2xl shadow-black/40",
                    "ring-1 ring-white/10",
                    isCenter && "ring-2 ring-primary/50"
                )}
            >
                {/* Cover Art */}
                <CoverArtImage
                    src={getCoverArtUrl(item.coverArt, coverArtType, "500")}
                    alt={item.name}
                    className="absolute inset-0 w-full h-full object-cover"
                />
                
                {/* Reflection gradient overlay for non-center items */}
                {!isCenter && (
                    <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
                )}
                
                {/* Hover overlay for center item */}
                {isCenter && (
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors duration-200 flex items-center justify-center group">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handlePlay();
                                }}
                                className="w-16 h-16 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
                            >
                                <svg
                                    className="w-8 h-8 text-primary-foreground fill-current ml-1"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            </button>
                        </div>
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
                    src={getCoverArtUrl(item.coverArt, coverArtType, "500")}
                    alt=""
                    className="w-full h-[280px] object-cover blur-[2px]"
                />
            </div>
        </div>
    );
}

export const CoverflowItemCard = memo(CoverflowItemCardComponent);
