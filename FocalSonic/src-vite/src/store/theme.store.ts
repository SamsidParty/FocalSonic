import { useWindowStore } from "@/store/window.store";
import { IThemeContext, SongPageStyle, Theme } from "@/types/themeContext";
import merge from "lodash/merge";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { createWithEqualityFn } from "zustand/traditional";

export const useThemeStore = createWithEqualityFn<IThemeContext>()(
    subscribeWithSelector(
        persist(
            devtools(
                immer((set) => ({
                    theme: (window.igniteView) ? Theme.System : Theme.GithubDark,
                    uiFont: "Sora",
                    lyricsFont: "Sora",
                    setTheme: (theme: Theme) => {
                        set((state) => {
                            state.theme = theme;

                            // Reset accent color if not using system theme
                            if (theme != Theme.System) {
                                state.accentColor = undefined;
                            }
                        });
                    },
                    setUIFont(font) {
                        set((state) => {
                            state.uiFont = font;
                        });
                    },
                    setLyricsFont(font) {
                        set((state) => {
                            state.lyricsFont = font;
                        });
                    },
                    isPlayerAtTop: false,
                    setIsPlayerAtTop(isAtTop: boolean) {
                        set((state) => {
                            state.isPlayerAtTop = isAtTop;
                        });
                    },
                    playerStyle: "default",
                    setPlayerStyle(style) {
                        set((state) => {
                            state.playerStyle = style;
                        });
                    },
                    enableLyricGlow: true,
                    setEnableLyricGlow(value: boolean) {
                        set((state) => {
                            state.enableLyricGlow = value;
                        });
                    },
                    enableLyricBlur: true,
                    setEnableLyricBlur(value: boolean) {
                        set((state) => {
                            state.enableLyricBlur = value;
                        });
                    },
                    vibrancyMode: "acrylic",
                    setVibrancyMode(mode) {
                        set((state) => {
                            state.vibrancyMode = mode;
                        });

                        if (window.igniteView?.commandBridge?.setWindowVibrancy) {
                            window.igniteView.commandBridge.setWindowVibrancy(mode);
                        }
                    },
                    accentColor: undefined,
                    setAccentColor(color: string) {
                        set((state) => {
                            state.accentColor = color;
                        });
                    },
                    coverflowStyle: "modern",
                    setCoverflowStyle(style: "modern" | "classic") {
                        set((state) => {
                            state.coverflowStyle = style;
                        });
                    },
                    songPageStyle: "blur",
                    setSongPageStyle(style: SongPageStyle) {
                        set((state) => {
                            state.songPageStyle = style;
                        });
                    },
                })),
                {
                    name: "theme_store",
                },
            ),
            {
                name: "theme_store",
                version: 1,
                merge: (persistedState, currentState) => {
                    return merge(currentState, persistedState);
                },
            },
        ),
    ),
);

export const useTheme = () => useThemeStore((state) => state);

export const usePlayerStyle = () => {
    const playerStyle = useThemeStore((state) => state.playerStyle);
    const isPlayerAtTop = useThemeStore((state) => state.isPlayerAtTop);
    const isCompact = useWindowStore((state) => state.isCompact);

    // The compact layout (which the mini player always uses) only has room for the slim player
    if (isCompact) {
        return { playerStyle: "slim" as const, isPlayerAtTop: false, useSlimButtons: true };
    }

    return { playerStyle, isPlayerAtTop, useSlimButtons: playerStyle === "slim" || playerStyle === "floating" };
};