import { service } from "@/service/service";
import { checkServerType } from "@/utils/servers";
import { useEffect } from "react";

interface ImageProps {
    src: string
    alt: string
    className?: string
    animated?: boolean
    animationCatalogID?: string
}

export default function CoverArtImage(props: ImageProps) {

    const { isAppleMusic } = checkServerType();

    const fetchAnimatedArtwork = async () => {
        if (isAppleMusic && props.animationCatalogID && props.animated) {
            const song = await service.songs.getAnimatedCoverArt(props.animationCatalogID);
            console.log(song);
        }
    };

    useEffect(() => {
        fetchAnimatedArtwork();
    }, [props.animationCatalogID, props.animated]);

    return (
        <div {...props} className={props.className + (props.animated ? " album-art-animation" : "") + " bg-contain"} style={{ backgroundImage: `url('${props.src}')` }} />
    );
}