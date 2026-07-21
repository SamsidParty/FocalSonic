import {
    ScrollArea,
    scrollAreaViewportSelector,
} from "@/app/components/ui/scroll-area";
import { service } from "@/service/service";
import { LyricChannel } from "@/types/serverConfig";
import { useAppStore } from "@/store/app.store";
import { usePlayerRef, usePlayerSonglist } from "@/store/player.store";
import { usePlayerStyle, useTheme } from "@/store/theme.store";
import { hasNonLatin, TRANSLATION_MARKER, TRANSLITERATION_MARKER } from "@/utils/lyricEligibility";
import { parseLrc } from "@/utils/lrcParser";
import { LyricsRenderer } from "@/utils/LyricsRenderer";
import { stripLRCLine } from "@/utils/lyricUtils";
import { translateText } from "@/utils/translate";
import useDebouncedWindowSize from "@/utils/useDebouncedWindowSize";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { ComponentPropsWithoutRef, useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { areLyricsSynced, areLyricsTTML, convertTTMLToLRC } from "../lyrics/lyric-helpers";

// Alt channels that can be fetched from an external API when the source lyrics
// don't already carry them.
type FetchableChannel = "transliteration" | "translation";

/**
 * Whether an alt channel needs to be fetched from Google Translate for these
 * lyrics: true when a meaningful share of non-Latin lines lack that channel.
 * Mirrors the historical >20% heuristic, now scoped per channel.
 */
function channelNeedsFetch(baseLyrics: string, channel: FetchableChannel): boolean {
    const marker = channel === "transliteration" ? TRANSLITERATION_MARKER : TRANSLATION_MARKER;
    const lines = baseLyrics.split("\n");

    let linesWithoutAlt = 0;
    for (const line of lines) {
        if (hasNonLatin(stripLRCLine(line)) && !line.includes(marker)) {
            linesWithoutAlt++;
        }
    }

    return linesWithoutAlt > 0 && linesWithoutAlt / lines.length > 0.2;
}

/**
 * Fetch one alt channel for the whole song and return a per-line-index map of
 * alt text. The song is sent as a single `⁜`-delimited blob to avoid throttling.
 * Transliteration is skipped per-line for fully-Latin lines so English lines in
 * a mixed-language song don't get bogus romaji.
 */
async function fetchAltChannel(baseLyrics: string, channel: FetchableChannel): Promise<Record<number, string>> {
    const lines = baseLyrics.split("\n");

    let monolith = "";
    for (const line of lines) {
        monolith += stripLRCLine(line) + "\n⁜";
    }

    const translated = (await translateText(
        monolith.trim(),
        channel === "transliteration" ? "ja" : "en",
        channel === "transliteration",
    )) || "";

    const translatedLines = translated.split("⁜");
    const result: Record<number, string> = {};

    lines.forEach((line, index) => {
        const original = stripLRCLine(line);
        const altText = (translatedLines[index] ?? "").trim();

        if (!altText) return;
        // Per-line redundancy: don't romanize lines that are already Latin.
        if (channel === "transliteration" && !hasNonLatin(original)) return;

        result[index] = altText;
    });

    return result;
}

interface LyricProps {
    lyrics?: string,
    customLyrics?: string, // bypass auto-fetch and render this TTML/eLRC string directly
    disableAltLyrics?: boolean, // ignore the global alt-lyric mode (used by finder previews)
    leftAlign?: boolean,
    small?: boolean,
    oneLine?: boolean,
    visible?: boolean,
    containerClassName?: string,
}

export function LyricsTab(props: LyricProps) {
    const { currentSong } = usePlayerSonglist();
    const { t } = useTranslation();

    const { artist, title, duration, id } = currentSong;

    const { data: lyrics, isLoading } = useQuery({
        queryKey: ["get-lyrics", artist, title, duration],
        enabled: !props.customLyrics,
        queryFn: async () => {

            if (window?.igniteView) {
                // Check for overriden lyrics
                const overriddenLyrics = id ? (await window?.igniteView?.commandBridge?.getLyricOverride(id)) : null;

                if (overriddenLyrics) {
                    return overriddenLyrics;
                }
            }

            const foundLyrics = await service.lyrics.getLyrics({
                artist,
                title,
                duration,
                id,
                isrc: currentSong?.appleMusic?.data?.attributes?.isrc
            });


            return foundLyrics;
        },
    });

    const noLyricsFound = t("fullscreen.noLyrics");
    const loadingLyrics = t("fullscreen.loadingLyrics");

    const effectiveLyrics = props.customLyrics ?? lyrics;

    if (!props.customLyrics && isLoading) {
        return <CenteredMessage>{loadingLyrics}</CenteredMessage>;
    } else if (effectiveLyrics) {
        return areLyricsSynced(effectiveLyrics) ? (
            <SyncedLyrics {...props} lyrics={effectiveLyrics} />
        ) : (
            <UnsyncedLyrics {...props} lyrics={effectiveLyrics} />
        );
    } else {
        return <CenteredMessage>{noLyricsFound}</CenteredMessage>;
    }
}

function SyncedLyrics(props: LyricProps) {
    const playerRef = usePlayerRef();
    const { altLyricChannels } = useAppStore().settings;
    const selectedChannels: LyricChannel[] = props.disableAltLyrics ? ["original"] : altLyricChannels;
    const { isMiniPlayer } = usePlayerStyle();
    const { width, height, isResizing } = useDebouncedWindowSize(100);
    const { enableLyricBlur, enableLyricGlow } = useTheme();

    // Refs for imperative rendering
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<LyricsRenderer | null>(null);
    const rafRef = useRef<number | null>(null);

    const { lyrics, leftAlign, small, oneLine } = props;

    // Instant base conversion (no network). Renders immediately; any missing alt
    // channels are filled in asynchronously below without blanking the primary.
    const baseLyrics = useMemo(() => {
        if (!lyrics) return null;
        return areLyricsTTML(lyrics) ? convertTTMLToLRC(lyrics) : lyrics;
    }, [lyrics]);

    // Decide which alt channels are selected, missing, and worth fetching.
    const needTransliteration = !!baseLyrics && selectedChannels.includes("transliteration") && channelNeedsFetch(baseLyrics, "transliteration");
    const needTranslation = !!baseLyrics && selectedChannels.includes("translation") && channelNeedsFetch(baseLyrics, "translation");

    const transliterationQuery = useQuery({
        queryKey: ["alt-lyric-channel", "transliteration", baseLyrics],
        enabled: needTransliteration,
        queryFn: () => fetchAltChannel(baseLyrics!, "transliteration"),
    });

    const translationQuery = useQuery({
        queryKey: ["alt-lyric-channel", "translation", baseLyrics],
        enabled: needTranslation,
        queryFn: () => fetchAltChannel(baseLyrics!, "translation"),
    });

    // Channels that are actively fetching - the renderer shows skeletons for these.
    const loadingChannels = useMemo(() => {
        const set = new Set<LyricChannel>();
        if (needTransliteration && transliterationQuery.isFetching) set.add("transliteration");
        if (needTranslation && translationQuery.isFetching) set.add("translation");
        return set;
    }, [needTransliteration, needTranslation, transliterationQuery.isFetching, translationQuery.isFetching]);

    // Merge any fetched channels back into the base lyrics string.
    const mergedLyrics = useMemo(() => {
        if (!baseLyrics) return null;

        const translit = transliterationQuery.data;
        const translation = translationQuery.data;
        if (!translit && !translation) return baseLyrics;

        return baseLyrics.split("\n").map((line, index) => {
            let out = line;
            if (translit?.[index] && !line.includes(TRANSLITERATION_MARKER)) {
                out += `${TRANSLITERATION_MARKER}<00:00.00>${translit[index]}<00:00.00>`;
            }
            if (translation?.[index] && !line.includes(TRANSLATION_MARKER)) {
                out += `${TRANSLATION_MARKER}<00:00.00>${translation[index]}<00:00.00>`;
            }
            return out;
        }).join("\n");
    }, [baseLyrics, transliterationQuery.data, translationQuery.data]);

    // Parse lyrics once when they change
    const parsedLyrics = useMemo(() => {
        if (!mergedLyrics) return null;
        return parseLrc(mergedLyrics);
    }, [mergedLyrics]);

    // Stable primitive keys so the renderer only rebuilds when selection/loading
    // actually change (arrays/sets would otherwise churn the effect every render).
    const channelsKey = selectedChannels.join(",");
    const loadingKey = Array.from(loadingChannels).sort().join(",");

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
            selectedChannels,
            loadingChannels,
        });

        renderer.mount(containerRef.current);
        rendererRef.current = renderer;

        return () => {
            renderer.destroy();
            rendererRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [parsedLyrics, leftAlign, small, oneLine, enableLyricBlur, enableLyricGlow, skipToTime, width, height, isResizing, channelsKey, loadingKey]);

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

    if (isResizing) return null;

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
