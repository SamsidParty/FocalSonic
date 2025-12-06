import React, { memo } from "react";

import { getTextSizeClass } from "@/utils/getTextSizeClass";
import clsx from "clsx";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { AlbumArtistInfo } from "../album/artists";
import { ImageHeaderProps } from "../album/image-header";
import { HeaderInfoGenerator } from "../header-info";
import DarkVeil from "../ui/Backgrounds/DarkVeil/DarkVeil";

const DarkVeilMemo = memo(DarkVeil, (o, n) => o.style?.opacity === n.style?.opacity);


export default function AppleArtistEnhancedHeader({
    type,
    title,
    subtitle,
    artistId,
    artists,
    albumId,
    coverArtId,
    coverArtType,
    coverArtSize,
    coverArtAlt,
    badges,
    children,
    isPlaylist = false,
}: ImageHeaderProps) {
    

    const enhancedCover = artists[0]?.appleMusic?.data?.[0]?.attributes?.editorialArtwork?.subscriptionHero?.url;
    const headerImage = enhancedCover || artists[0]?.appleMusic?.data?.[0]?.attributes?.artwork?.url || artists[0].coverArt;

    return (
        <div
            className="flex relative w-full px-12 mb-4"
            key={`header-${coverArtId}`}
        >
            <LazyLoadImage 
                src={headerImage?.replace("{w}", "2160").replace("{h}", "1440").replace("{f}", "jpg")} 
                alt={coverArtAlt} 
                className={clsx("object-cover w-full h-full")}
                wrapperClassName="absolute inset-0"
                effect="opacity"
                style={{
                    maskImage: "linear-gradient(to top, transparent 0%, black 80%, black 100%)"
                }}
            />
            

            <div className="flex w-full flex-col justify-end z-10">
                <div className="min-h-[calc(3rem+200px)]"></div>
                <h1
                    className={clsx(
                        "max-w-full scroll-m-20 font-bold tracking-tight antialiased drop-shadow-md break-words line-clamp-2",
                        getTextSizeClass(title),
                    )}
                >
                    {title}
                </h1>

                {
                    artistId && (
                        <AlbumArtistInfo id={artistId} name={subtitle} />
                    )
                }

                {children}

                <div className="flex items-center mt-2">
                    <HeaderInfoGenerator badges={badges} showFirstDot={false} />
                </div>
            </div>

        </div>
    );
}
