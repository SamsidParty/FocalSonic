import { useTheme } from "@/store/theme.store";
import { Theme } from "@/types/themeContext";
import { useLayoutEffect } from "react";

export const appThemes: Theme[] = Object.values(Theme);

export function ThemeObserver() {
    const { theme } = useTheme();

    useLayoutEffect(() => {
        async function update() {
            const root = window.document.documentElement;

            root.classList.remove(...appThemes);
            root.classList.add(theme);
        }

        update();
    }, [theme]);

    return null;
}
