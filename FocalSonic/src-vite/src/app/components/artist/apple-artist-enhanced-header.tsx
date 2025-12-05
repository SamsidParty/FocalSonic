import React, { memo } from "react";

import { getTextSizeClass } from "@/utils/getTextSizeClass";
import clsx from "clsx";
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
    
    const enhancedCover = artists[0]?.appleMusic?.data.attributes?.editorialArtwork?.subscriptionHero?.url;
    const headerImage = enhancedCover || artists[0]?.appleMusic?.data.attributes?.artwork?.url;

    return (
        <div
            className="flex relative w-full h-[calc(3rem+300px)] 2xl:h-[calc(3rem+400px)] px-4 mb-4"
            key={`header-${coverArtId}`}
        >
            <img src={headerImage?.replace("{w}", "2160").replace("{h}", "1080").replace("{f}", "jpg")} alt={coverArtAlt} className={clsx("object-cover w-full h-full absolute inset-0")} />
            
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/30 to-transparent z-[5]"></div>

            <div className="flex w-full max-w-[calc(100%-216px)] 2xl:max-w-[calc(100%-266px)] flex-col justify-end z-10">
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
