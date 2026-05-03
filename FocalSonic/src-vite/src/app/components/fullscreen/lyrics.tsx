import {
    ScrollArea,
    scrollAreaViewportSelector,
} from "@/app/components/ui/scroll-area";
import { service } from "@/service/service";
import { useAppStore } from "@/store/app.store";
import { usePlayerRef, usePlayerSonglist } from "@/store/player.store";
import { usePlayerStyle, useTheme } from "@/store/theme.store";
import { parseLrc } from "@/utils/lrcParser";
import { LyricsRenderer } from "@/utils/LyricsRenderer";
import { stripLRCLine } from "@/utils/lyricUtils";
import { translateText } from "@/utils/translate";
import useDebouncedWindowSize from "@/utils/useDebouncedWindowSize";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { ComponentPropsWithoutRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { areLyricsSynced, areLyricsTTML, convertTTMLToLRC } from "../lyrics/lyric-helpers";
import { LyricsResult } from "@/service/subsonic/lyrics";

const NON_LATIN_REGEX = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Devanagari}\p{Script=Bengali}\p{Script=Gurmukhi}\p{Script=Gujarati}\p{Script=Oriya}\p{Script=Tamil}\p{Script=Telugu}\p{Script=Kannada}\p{Script=Malayalam}\p{Script=Sinhala}\p{Script=Thai}\p{Script=Khmer}\p{Script=Lao}\p{Script=Myanmar}\p{Script=Ethiopic}\p{Script=Georgian}\p{Script=Armenian}\p{Script=Cherokee}\p{Script=Yi}]/u;

interface LyricProps {
    lyrics?: string,
    leftAlign?: boolean,
    small?: boolean,
    oneLine?: boolean,
    visible?: boolean,
    containerClassName?: string,
}

export function LyricsTab(props: LyricProps) {
    const { currentSong } = usePlayerSonglist();
    const { t } = useTranslation();
    const [showLyricsSource, setShowLyricsSource] = useState(false);
    const hideSourceTimerRef = useRef<number | null>(null);

    const { artist, title, duration, id } = currentSong;

    const { data: lyricsResult, isLoading } = useQuery<LyricsResult | undefined>({
        queryKey: ["get-lyrics", id, artist, title, duration],
        queryFn: async () => {

            if (window?.igniteView) {
                // Check for overriden lyrics
                const overriddenLyrics = await window?.igniteView?.commandBridge?.getLyricOverride(id);

                if (overriddenLyrics) {
                    return {
                        value: overriddenLyrics,
                        source: "Override",
                        durationMs: 0,
                    };
                }
            }

            return await service.lyrics.getLyrics({
                artist,
                title,
                duration,
                id,
                isrc: currentSong?.appleMusic?.data?.attributes?.isrc
            });
        },
    });

    const noLyricsFound = t("fullscreen.noLyrics");
    const loadingLyrics = t("fullscreen.loadingLyrics");
    const lyrics = lyricsResult?.value;

    const showSourceBadge = useCallback(() => {
        if (!lyricsResult?.source) return;

        setShowLyricsSource(true);

        if (hideSourceTimerRef.current) {
            window.clearTimeout(hideSourceTimerRef.current);
        }

        hideSourceTimerRef.current = window.setTimeout(() => {
            setShowLyricsSource(false);
        }, 3000);
    }, [lyricsResult]);

    useEffect(() => {
        showSourceBadge();

        return () => {
            if (hideSourceTimerRef.current) {
                window.clearTimeout(hideSourceTimerRef.current);
            }
        };
    }, [showSourceBadge]);

    if (isLoading) {
        return <CenteredMessage>{loadingLyrics}</CenteredMessage>;
    } else if (lyrics) {
        return (
            <div className="relative w-full h-full" onWheel={showSourceBadge} onTouchMove={showSourceBadge}>
                {areLyricsSynced(lyrics) ? (
                    <SyncedLyrics {...props} lyrics={lyrics} />
                ) : (
                    <UnsyncedLyrics {...props} lyrics={lyrics} />
                )}
                <LyricsSourceBadge lyricsResult={lyricsResult} visible={showLyricsSource} />
            </div>
        );
    } else {
        return <CenteredMessage>{noLyricsFound}</CenteredMessage>;
    }
}

function LyricsSourceBadge({ lyricsResult, visible }: { lyricsResult?: LyricsResult, visible: boolean }) {
    if (!lyricsResult?.source) return null;

    const seconds = (lyricsResult.durationMs / 1000).toFixed(lyricsResult.durationMs < 1000 ? 1 : 2);

    return (
        <div
            className={clsx(
                "pointer-events-none absolute bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/15 bg-black/55 px-4 py-2 text-xs font-semibold text-white/90 shadow-2xl backdrop-blur-md transition-all duration-300",
                visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
            )}
        >
            {lyricsResult.source} {seconds}s
        </div>
    );
}

function SyncedLyrics(props: LyricProps) {
    const playerRef = usePlayerRef();
    const { altLyricsMode } = useAppStore().settings;
    const { isMiniPlayer } = usePlayerStyle();
    const { width, height, isResizing } = useDebouncedWindowSize(100);
    const { enableLyricBlur, enableLyricGlow } = useTheme();

    // Refs for imperative rendering
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<LyricsRenderer | null>(null);
    const rafRef = useRef<number | null>(null);

    let { lyrics } = props;
    const { leftAlign, small, oneLine } = props;

    // Convert and translate lyrics
    const { data: convertedLyrics, isLoading } = useQuery({
        queryKey: ["convert-and-translate-lyrics", lyrics, altLyricsMode],
        queryFn: async () => {
            if (areLyricsTTML(lyrics)) {
                lyrics = convertTTMLToLRC(lyrics!, altLyricsMode);
            }

            if (altLyricsMode === "translation" || altLyricsMode === "transliteration") {
                const lines = lyrics!.split("\n");
                let needsTranslation = false;
                let linesWithoutAlt = 0;

                for (const line of lines) {
                    const parts = line.split("⏩");
                    const mainLyric = parts[0] || "";
                    const altLyric = parts[1] || "";

                    if (NON_LATIN_REGEX.test(mainLyric)) {
                        if (altLyric.trim() === "") {
                            linesWithoutAlt++;
                        }
                    }
                }

                // Sometimes a few lines might be missing translation but most of them are there
                // Trigger translation if more than 20% of lines are missing alt lyrics
                if (linesWithoutAlt > 0 && linesWithoutAlt / lines.length > 0.2) {
                    needsTranslation = true;
                }

                if (needsTranslation) {
                    let translatedMonolith = "";
                    for (const line of lines) {
                        const strippedLine = stripLRCLine(line);
                        translatedMonolith += strippedLine + "\n⁜";
                    }


                    // Translate as one block because multiple requests can get throttled
                    translatedMonolith = (await translateText(translatedMonolith.trim(), altLyricsMode === "transliteration" ? "ja" : "en", altLyricsMode === "transliteration")) || "";

                    // Reintegrate translated lines back into LRC format
                    const translatedLines = translatedMonolith.split("⁜");
                    const finalLyricsLines = lyrics!.split("\n").map((line, index) => {
                        const altLyric = translatedLines[index].trim() || "";
                        return line.split("⏩")[0] + `⏩<00:00.00>${altLyric}<00:00.00>`; // Append dummy ELRC tag to translated part
                    });

                    lyrics = finalLyricsLines.join("\n");
                }
            }

            return lyrics;
        },
    });

    // Parse lyrics once when they change
    const parsedLyrics = useMemo(() => {
        if (!convertedLyrics) return null;
        return parseLrc(convertedLyrics);
    }, [convertedLyrics]);

    // Seek callback
    const skipToTime = useCallback((timeMs: number) => {
        if (playerRef) {
            playerRef.currentTime = timeMs / 1000;
        }
    }, [playerRef]);

    // Mount/unmount renderer
    useEffect(() => {
        if (!containerRef.current || !parsedLyrics || isResizing) {
            return;
        }

        // Clean up existing renderer
        if (rendererRef.current) {
            rendererRef.current.destroy();
        }

        // Create new renderer
        const renderer = new LyricsRenderer(parsedLyrics, {
            leftAlign,
            small,
            oneLine,
            enableBlur: enableLyricBlur,
            enableGlow: enableLyricGlow,
            onSeek: skipToTime,
        });

        renderer.mount(containerRef.current);
        rendererRef.current = renderer;

        return () => {
            renderer.destroy();
            rendererRef.current = null;
        };
    }, [parsedLyrics, leftAlign, small, oneLine, enableLyricBlur, enableLyricGlow, skipToTime, width, height, isResizing]);

    // Animation loop - updates renderer without React rerenders
    useEffect(() => {
        if (!props.visible || !rendererRef.current) {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
            return;
        }

        // Force an immediate update to sync with current playback position
        const timestampMs = (playerRef?.currentTime || 0) * 1000;
        rendererRef.current.update(timestampMs);

        const updateFrame = () => {
            const timestampMs = (playerRef?.currentTime || 0) * 1000;
            rendererRef.current?.update(timestampMs);
            rafRef.current = requestAnimationFrame(updateFrame);
        };

        rafRef.current = requestAnimationFrame(updateFrame);

        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [props.visible, playerRef, parsedLyrics]);

    if (isResizing || isLoading) return null;

    return (
        <div
            ref={containerRef}
            className={
                clsx(
                    "text-center font-semibold text-4xl 2xl:text-6xl px-2 lrc-box font-lyrics text-[var(--lyric-color)]",
                    oneLine ? "pointer-events-none justify-center lyrics-one-line" : "w-full h-full maskImage-big-player-lyrics ",
                    props.containerClassName || ""
                )
            }
            style={{
                "--lyric-color": small ? "var(--foreground)" : "white"
            } as React.CSSProperties}
        />
    );
}

function UnsyncedLyrics({ lyrics }: LyricProps) {
    const { currentSong } = usePlayerSonglist();
    const lyricsBoxRef = useRef<HTMLDivElement>(null);

    // Memoize lines array
    const lines = useMemo(() => lyrics!.split("\n"), [lyrics]);

    // Scroll to top when song changes
    useEffect(() => {
        if (lyricsBoxRef.current) {
            const scrollArea = lyricsBoxRef.current.querySelector(
                scrollAreaViewportSelector,
            ) as HTMLDivElement;

            scrollArea.scrollTo({
                top: 0,
                behavior: "smooth",
            });
        }
    }, [currentSong]);

    return (
        <ScrollArea
            type="always"
            className="w-full h-full text-white overflow-y-auto text-center font-semibold font-lyrics text-xl 2xl:text-2xl px-2 scroll-smooth"
            thumbClassName="secondary-thumb-bar"
            ref={lyricsBoxRef}
        >
            {lines.map((line, index) => (
                <p
                    key={index}
                    className={clsx(
                        "leading-10 drop-shadow-lg text-balance",
                        index === 0 && "mt-6",
                        index === lines.length - 1 && "mb-10",
                    )}
                >
                    {line}
                </p>
            ))}
        </ScrollArea>
    );
}

type CenteredMessageProps = ComponentPropsWithoutRef<"p">

function CenteredMessage({ children }: CenteredMessageProps) {
    return (
        <div className="w-full h-full text-white flex justify-center items-center">
            <p className="leading-10 drop-shadow-lg text-center font-semibold text-xl 2xl:text-2xl">
                {children}
            </p>
        </div>
    );
}
