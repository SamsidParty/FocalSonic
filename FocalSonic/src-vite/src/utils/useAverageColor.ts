import { useEffect, useState } from "react";
import { getAverageColor } from "./getAverageColor";

export default function useAverageColor(imageUrl: string | null, mode?: string): string | null {
    const [color, setColor] = useState<string | null>(null);

    // Load the image and calculate the average color
    useEffect(() => {
        if (!imageUrl) {
            setColor(null);
            return;
        }
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = async () => {
            const averageColor = await getAverageColor(img, mode || "LightVibrant");
            setColor(averageColor);
        };
        img.src = imageUrl;

        // Cleanup function to revoke object URL if used
        return () => {
            if (img.src.startsWith("blob:")) {
                URL.revokeObjectURL(img.src);
            }
        };
    }, [imageUrl, mode]);

    return color;
}