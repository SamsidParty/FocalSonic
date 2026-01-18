import { IThemeContext, Theme } from "@/types/themeContext";
import merge from "lodash/merge";
import { useEffect, useState } from "react";
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

    const { playerStyle, isPlayerAtTop } = useTheme();
    const [isMiniPlayer, setIsMiniPlayer] = useState(window.matchMedia("(max-width: 780px)").matches);

    useEffect(() => {
        const handleResize = () => {
            setIsMiniPlayer(window.matchMedia("(max-width: 780px)").matches);
        };

        // Add event listener when the component mounts
        window.addEventListener("resize", handleResize);

        // Clean up the event listener when the component unmounts
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);



    // Force slim style in mini player
    if (isMiniPlayer) {
        return { playerStyle: "slim", isPlayerAtTop: false, isMiniPlayer, useSlimButtons: true };
    }

    return { playerStyle, isPlayerAtTop, isMiniPlayer, useSlimButtons: playerStyle === "slim" || playerStyle === "floating" };
};