import { service } from "@/service/service";
import { checkServerType } from "@/utils/servers";
import ReactHlsPlayer from "@gumlet/react-hls-player";
import React, { useEffect, useState } from "react";


import { LazyLoadImage } from "react-lazy-load-image-component";

interface ImageProps {
    src: string
    alt: string
    className?: string
    animated?: boolean
    animationCatalogID?: string
    animationCatalogType?: "songs" | "albums"
}

export default function CoverArtImage(props: ImageProps) {

    const { isAppleMusic } = checkServerType();
    const [hlsArtworkURL, setHlsArtworkURL] = useState<string | null>(null);
    const isAnimationValid = isAppleMusic && props.animationCatalogID && props.animated;

    const fetchAnimatedArtwork = async () => {
        if (isAnimationValid) {
            const artURL = await service.songs.getAnimatedCoverArt(props.animationCatalogID, props.animationCatalogType);

            if (artURL) {
                setHlsArtworkURL(artURL);
            }
        }
    };

    useEffect(() => {
        fetchAnimatedArtwork();
    }, [props.animationCatalogID, props.animated]);

    return (
        <div className="relative w-full h-full">
            <LazyLoadImage className="absolute inset-0" style={hlsArtworkURL ? { zIndex: -10 } : { position: "absolute" }} {...props} />
            {
                hlsArtworkURL && (
                    <ReactHlsPlayer
                        className="absolute inset-0"
                        src={hlsArtworkURL}
                        autoPlay
                        loop
                        muted
                    />
                )
            }

        </div>
    );
}