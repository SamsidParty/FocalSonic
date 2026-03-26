import { service } from "@/service/service";
import { checkServerType } from "@/utils/servers";
import { cn } from "@/lib/utils";
import ReactHlsPlayer from "@gumlet/react-hls-player";
import React, { ComponentProps, useEffect, useState } from "react";


import { LazyLoadImage } from "react-lazy-load-image-component";

interface ImageProps extends ComponentProps<typeof LazyLoadImage> {
    animated?: boolean
    animationCatalogID?: string
    animationCatalogType?: "songs" | "albums"
}

export default function CoverArtImage(props: ImageProps) {

    const {
        className,
        animated,
        animationCatalogID,
        animationCatalogType,
        ...imageProps
    } = props;

    const { isAppleMusic } = checkServerType();
    const [hlsArtworkURL, setHlsArtworkURL] = useState<string | null>(null);
    const [isAnimatedArtworkReady, setIsAnimatedArtworkReady] = useState(false);
    const isAnimationValid = isAppleMusic && animationCatalogID && animated;

    useEffect(() => {
        let isDisposed = false;

        setHlsArtworkURL(null);
        setIsAnimatedArtworkReady(false);

        if (!isAnimationValid) {
            return () => {
                isDisposed = true;
            };
        }

        const fetchAnimatedArtwork = async () => {
            const artURL = await service.songs.getAnimatedCoverArt(animationCatalogID, animationCatalogType);

            if (!isDisposed && artURL) {
                setHlsArtworkURL(artURL);
            }
        };

        fetchAnimatedArtwork();

        return () => {
            isDisposed = true;
        };
    }, [animationCatalogID, animationCatalogType, isAnimationValid]);

    return (
        <div className="relative h-full w-full overflow-hidden">
            <LazyLoadImage
                {...imageProps}
                className={cn(
                    "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
                    isAnimatedArtworkReady && "opacity-0",
                    className,
                )}
            />
            {hlsArtworkURL && (
                <ReactHlsPlayer
                    className={cn(
                        "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
                        isAnimatedArtworkReady ? "opacity-100" : "opacity-0",
                    )}
                    src={hlsArtworkURL}
                    autoPlay
                    loop
                    muted
                    playsInline
                    onCanPlay={() => setIsAnimatedArtworkReady(true)}
                />
            )}
        </div>
    );
}