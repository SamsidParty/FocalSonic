import { useTheme } from "@/store/theme.store";
import { Theme } from "@/types/themeContext";
import { useLayoutEffect } from "react";

export const appThemes: Theme[] = Object.values(Theme);

export function ThemeObserver() {
    const { theme, uiFont, lyricsFont } = useTheme();

    useLayoutEffect(() => {
        async function update() {
            const root = window.document.documentElement;

            root.classList.remove(...appThemes);
            root.classList.add(theme);
            root.style.setProperty("--theme-font", uiFont);
            root.style.setProperty("--theme-lyrics-font", lyricsFont);
        }

        update();
    }, [theme, uiFont, lyricsFont]);

    return null;
}
