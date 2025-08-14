import { IThemeContext, Theme } from "@/types/themeContext";
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
