import { useTheme } from "@/store/theme.store";
import { Theme } from "@/types/themeContext";
import { useLayoutEffect } from "react";

export const appThemes: Theme[] = Object.values(Theme);

export function ThemeObserver() {
    const { theme, uiFont, lyricsFont, playerStyle, accentColor } = useTheme();

    useLayoutEffect(() => {
        async function update() {
            const root = window.document.documentElement;

            root.classList.remove(...appThemes);
            root.classList.add(theme);
            root.style.setProperty("--theme-font", uiFont);
            root.style.setProperty("--theme-lyrics-font", lyricsFont);

            if (accentColor) {
                root.style.setProperty("--system-accent-override", accentColor);
            }
            else {
                // Clear artificial accent color if it exists
                root.style.removeProperty("--system-accent-override");
            }

            root.setAttribute("player-style", playerStyle);
        }

        update();
    }, [theme, uiFont, lyricsFont, playerStyle, accentColor]);

    return null;
}
