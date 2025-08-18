import { LazyLoadImage } from "react-lazy-load-image-component";

interface ImageProps {
    src: string
    alt: string
    className?: string
}

export default function CoverArtImage(props: ImageProps) {
    return (
        <LazyLoadImage {...props} />
    );
}