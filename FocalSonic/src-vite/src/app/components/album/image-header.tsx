import randomCSSHexColor from "@chriscodesthings/random-css-hex-color";
import clsx from "clsx";
import React, { useState } from "react";

import { getCoverArtUrl } from "@/api/httpClient";
import { BadgesData, HeaderInfoGenerator } from "@/app/components/header-info";
import { CustomLightBox } from "@/app/components/lightbox";
import { cn } from "@/lib/utils";
import { CoverArt } from "@/types/coverArtType";
import { IFeaturedArtist } from "@/types/responses/artist";
import { getAverageColor } from "@/utils/getAverageColor";
import { getTextSizeClass } from "@/utils/getTextSizeClass";
import hexToCssFilter from "@/utils/hexToCssFilter.js";
import CoverArtImage from "../cover-art";
import DarkVeil from "../ui/Backgrounds/DarkVeil/DarkVeil";
import { AlbumArtistInfo } from "./artists";

export interface ImageHeaderProps {
    type: string
    title: string
    subtitle?: string
    artistId?: string
    artists?: IFeaturedArtist[]
    coverArtId?: string
    coverArtType: CoverArt
    coverArtSize: string
    coverArtAlt: string
    badges: BadgesData
    isPlaylist?: boolean
    albumId?: string,
    children?: React.ReactNode
}

export default function ImageHeader({
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
    const [open, setOpen] = useState(false);
    const [bgColor, setBgColor] = useState("");
    const [bgEffectStyle, setBgEffectStyle] = useState(null);

    function getImage() {
        return document.getElementById("cover-art-image") as HTMLImageElement;
    }

    async function handleLoadImage() {
        const img = getImage();
        if (!img) return;

        let color = randomCSSHexColor(true);

        try {
            color = await getAverageColor(img, "LightVibrant");
        } catch (ex) {
            console.warn(
                "handleLoadImage: unable to get image color. Using a random color.",
                ex
            );
        }

        const style = "opacity(1) " + hexToCssFilter(color);
        setBgEffectStyle(style);
        setBgColor(color);
    }

    function handleError() {
        const img = getImage();
        if (!img) return;

        img.crossOrigin = null;
    }

    const hasMultipleArtists = artists ? artists.length > 1 : false;

    return (
        <div
            className="flex relative w-full h-[calc(3rem+200px)] 2xl:h-[calc(3rem+250px)]"
            key={`header-${coverArtId}`}
        >
            
            <div
                className={cn(
                    "w-full px-8 py-6 flex gap-4 absolute inset-0",
                )}
            >
                <DarkVeil style={{ filter: bgEffectStyle!, opacity: (!bgEffectStyle ? "0" : "1") }} className="transition-opacity duration-1000" speed={2} warpAmount={5}></DarkVeil>

                <div
                    className={cn(
                        "w-[200px] h-[200px] min-w-[200px] min-h-[200px]",
                        "2xl:w-[250px] 2xl:h-[250px] 2xl:min-w-[250px] 2xl:min-h-[250px]",
                        "bg-skeleton aspect-square bg-cover bg-center rounded",
                        "shadow-header-image overflow-hidden z-10",
                        "hover:scale-[1.02] ease-linear duration-100",
                    )}
                >
                    <CoverArtImage
                        key={coverArtId}
                        effect="opacity"
                        animated
                        animationCatalogID={albumId}
                        animationCatalogType="albums"
                        crossOrigin="anonymous"
                        id="cover-art-image"
                        src={getCoverArtUrl(coverArtId, coverArtType, coverArtSize)}
                        alt={coverArtAlt}
                        className="aspect-square object-cover w-full h-full cursor-pointer"
                        width="100%"
                        height="100%"
                        onLoad={handleLoadImage}
                        onError={handleError}
                        onClick={() => setOpen(true)}
                    />
                </div>

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



            <CustomLightBox
                open={open}
                close={setOpen}
                src={getCoverArtUrl(coverArtId, coverArtType, coverArtSize)}
                alt={coverArtAlt}
            />
        </div>
    );
}
