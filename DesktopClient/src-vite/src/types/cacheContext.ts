import { Palette } from "@vibrant/color";


export interface ICacheContext {
    imageDominantColors: Record<string, Palette>;
    saveImageDominantColor: (url: string, color: Palette) => void;
    tryGetImageDominantColor: (url: string) => Palette | undefined;
    lyrics: Record<string, string>;
    saveLyrics: (url: string, lyrics: string) => void;
    tryGetLyrics: (url: string) => string | undefined;
}
