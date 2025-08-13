import { Swatch } from "@vibrant/color";


export interface ICacheContext {
    imageDominantColors: Record<string, Swatch>;
    saveImageDominantColor: (url: string, color: Swatch) => void;
    tryGetImageDominantColor: (url: string) => Swatch | undefined;
}
