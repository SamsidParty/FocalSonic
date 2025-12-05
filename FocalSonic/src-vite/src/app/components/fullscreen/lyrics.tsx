import {
    ScrollArea,
    scrollAreaViewportSelector,
} from "@/app/components/ui/scroll-area";
import { service } from "@/service/service";
import { useAppStore } from "@/store/app.store";
import { usePlayerRef, usePlayerSonglist } from "@/store/player.store";
import { usePlayerStyle, useTheme } from "@/store/theme.store";
import { stripLRCLine } from "@/utils/lyricUtils";
import { isSafari } from "@/utils/osType";
import { translateText } from "@/utils/translate";
import useDebouncedWindowSize from "@/utils/useDebouncedWindowSize";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import React, { ComponentPropsWithoutRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Lrc, LrcLine } from "react-lrc";
import { areLyricsSynced, areLyricsTTML, convertTTMLToLRC } from "../lyrics/lyric-helpers";

// Move regex patterns outside component to avoid recreation
const ELRC_REGEX = /<(\d{2}):(\d{2})\.(\d{2})>([^<]+)/g;
const ELRC_TEST_REGEX = /^\s*(<\d{2}:\d{2}\.\d+>[^<]*)+\s*$/;
const NON_LATIN_REGEX = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Devanagari}\p{Script=Bengali}\p{Script=Gurmukhi}\p{Script=Gujarati}\p{Script=Oriya}\p{Script=Tamil}\p{Script=Telugu}\p{Script=Kannada}\p{Script=Malayalam}\p{Script=Sinhala}\p{Script=Thai}\p{Script=Khmer}\p{Script=Lao}\p{Script=Myanmar}\p{Script=Ethiopic}\p{Script=Georgian}\p{Script=Armenian}\p{Script=Cherokee}\p{Script=Yi}]/u;

interface LyricProps {
    lyrics: string,
    leftAlign?: boolean,
    small?: boolean,
    visible?: boolean
}

export function LyricsTab(props: LyricProps) {
    const { currentSong } = usePlayerSonglist();
    const { t } = useTranslation();

    const { artist, title, duration, id } = currentSong;

    const { data: lyrics, isLoading } = useQuery({
        queryKey: ["get-lyrics", artist, title, duration],
        queryFn: async () =>
        {

            if (window?.igniteView) {
                // Check for overriden lyrics
                const overriddenLyrics = await window?.igniteView?.commandBridge?.getLyricOverride(id);

                if (overriddenLyrics) {
                    return overriddenLyrics;
                }
            }

            const foundLyrics = await service.lyrics.getLyrics({
                artist,
                title,
                duration,
                id,
                isrc: currentSong?.appleMusic?.data.attributes.isrc
            });


            return foundLyrics;
        },
    });

    const noLyricsFound = t("fullscreen.noLyrics");
    const loadingLyrics = t("fullscreen.loadingLyrics");

    if (isLoading) {
        return <CenteredMessage>{loadingLyrics}</CenteredMessage>;
    } else if (lyrics) {
        return areLyricsSynced(lyrics) ? (
            <SyncedLyrics {...props} lyrics={lyrics} />
        ) : (
            <UnsyncedLyrics {...props} lyrics={lyrics} />
        );
    } else {
        return <CenteredMessage>{noLyricsFound}</CenteredMessage>;
    }
}

let currentLineNumber = -1;

function SyncedLyrics(props: LyricProps) {
    const playerRef = usePlayerRef();
    const [timestamp, setTimestamp] = useState<number>(0);
    const { altLyricsMode } = useAppStore().settings;
    const { isMiniPlayer } = usePlayerStyle();
    const { width, height, isResizing } = useDebouncedWindowSize(100);
    const rafRef = useRef<number | null>(null);

    let { lyrics, leftAlign, small } = props;

    const { data: convertedLyrics, isLoading } = useQuery({
        queryKey: ["convert-and-translate-lyrics", lyrics, altLyricsMode],
        queryFn: async () =>
        {
            if (areLyricsTTML(lyrics)) {
                lyrics = convertTTMLToLRC(lyrics!, altLyricsMode);
            }

            if (altLyricsMode === "translation" || altLyricsMode === "transliteration") {
                const lines = lyrics!.split("\n");
                let needsTranslation = false;

                for (const line of lines) {
                    const parts = line.split("⏩");
                    const mainLyric = parts[0] || "";
                    const altLyric = parts[1] || "";

                    if (NON_LATIN_REGEX.test(mainLyric)) {
                        if (altLyric.trim() === "") {
                            needsTranslation = true;
                            break;
                        }
                    }
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

    const formattedLyrics = useMemo(() => {
        return convertedLyrics || "";
    }, [convertedLyrics]);

    // Optimized timestamp update using useEffect instead of inline RAF
    useEffect(() => {
        if (!props.visible) {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
            return;
        }

        const updateTimestamp = () => {
            const newTimestamp = (playerRef?.currentTime || 0) * 1000;
            setTimestamp(prev => prev !== newTimestamp ? newTimestamp : newTimestamp + 0.001);
            rafRef.current = requestAnimationFrame(updateTimestamp);
        };

        rafRef.current = requestAnimationFrame(updateTimestamp);

        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [props.visible, playerRef]);

    // Memoize skipToTime callback
    const skipToTime = useCallback((timeMs: number) => {
        if (playerRef) {
            playerRef.currentTime = timeMs / 1000;
        }
    }, [playerRef]);

    // Memoize the line renderer to prevent recreation
    const lineRenderer = useCallback(
        (_props: any) => <MemoizedLrcLineRenderer {..._props} {...props} skipToTime={skipToTime} timestamp={timestamp / 1000} />,
        [props.leftAlign, props.small, skipToTime, timestamp]
    );

    // Memoize onLineUpdate callback
    const onLineUpdate = useCallback((l: any) => {
        currentLineNumber = l?.index;
    }, []);

    if (isResizing) return null;

    return (
        <div 
            className={
                clsx(
                    "w-full h-full text-center font-semibold text-4xl 2xl:text-6xl px-2 lrc-box font-lyrics maskImage-big-player-lyrics",
                    props.small ? " text-foreground" : "text-white"
                )
            }
        >
            <Lrc
                key={`debouncedlyrics_${width}x${height}`}
                lrc={formattedLyrics!}
                recoverAutoScrollInterval={1000}
                currentMillisecond={timestamp}
                id={"sync-lyrics-box-" + (leftAlign ? "left" : "center")}
                className={clsx("h-full z-40", !isSafari && "scroll-smooth")}
                onLineUpdate={onLineUpdate}
                verticalSpace={true}
                lineRenderer={lineRenderer}
            />
        </div>
    );
}

// Memoized LrcLineRenderer component
const MemoizedLrcLineRenderer = React.memo(LrcLineRenderer, (prevProps, nextProps) => {
    return (
        prevProps.active === nextProps.active &&
        prevProps.line.id === nextProps.line.id &&
        prevProps.timestamp === nextProps.timestamp &&
        prevProps.small === nextProps.small
    );
});

function LrcLineRenderer({ line, active, skipToTime, timestamp, small }: { line: LrcLine, active: boolean, skipToTime: (time: number) => void, timestamp: number, small?: boolean }) {

    const { enableLyricBlur, enableLyricGlow } = useTheme();

    let subLyric: string | null = null;
    let lyric = line?.content;

    if (line?.content.split("⏩").length > 1) {
        subLyric = line.content.split("⏩")[1];
        lyric = line.content.split("⏩")[0];
    }

    const elrcValues = useMemo(() => {
        const isElrc = ELRC_TEST_REGEX.test(lyric);
        const elrcPortions: any[] = [];

        const displayLyric = isElrc ? lyric : `⏩<00:00.00>${lyric}<00:00.00>`;

        // Create new regex instance for exec to avoid stateful issues
        const regex = new RegExp(ELRC_REGEX.source, ELRC_REGEX.flags);
        let match;

        while ((match = regex.exec(displayLyric)) !== null) {
            const lastElement = elrcPortions[elrcPortions.length - 1];
            const minutes = parseInt(match[1], 10);
            const seconds = parseInt(match[2], 10);
            const fractionOfSeconds = parseInt(match[3], 10);
            const totalSeconds = minutes * 60 + seconds + fractionOfSeconds / 100;

            if (totalSeconds > 0.05 || !lastElement) {
                elrcPortions.push({
                    time: Math.max(totalSeconds, 0),
                    text: match[4],
                });
            }
            else {
                lastElement && (lastElement.text += match[4]);
            }
        }

        if (elrcPortions.length === 1 && elrcPortions[0].time === 0) {
            elrcPortions[0].time = line.startMillisecond / 1000;
            elrcPortions[0].duration = 0.3;
        }

        for (let i = 0; i < elrcPortions.length; i++) {
            if (i < elrcPortions.length - 1) {
                elrcPortions[i].duration = (elrcPortions[i + 1].time - elrcPortions[i].time);
            } else {
                elrcPortions[i].duration = 0.3;
            }
        }
        
        return { isElrc, elrcPortions };
    }, [lyric, line.startMillisecond]);

    // Remove memoization - currentLineNumber is external and changes frequently
    let timeDiff = Math.abs((currentLineNumber || 0) - line.lineNumber);
    if (timeDiff > 5) timeDiff = 5;
    if (active || small || !enableLyricBlur) timeDiff = 0;
    const blurStyle = { filter: `blur(${timeDiff * 1.2}px)` };

    // Memoize click handler
    const handleClick = useCallback(() => {
        skipToTime(line.startMillisecond);
    }, [skipToTime, line.startMillisecond]);

    return (
        <p
            key={line?.id}
            onClick={handleClick}
            className={clsx(
                "lyric-line drop-shadow-lg z-40 cursor-pointer hover:opacity-100 duration-700",
                "transition-[opacity,transform,filter] motion-reduce:transition-none ease-long text-left xxs:leading-normal",
                (active) && "lyric-line-active",
                (active && !line?.isSubLyric) ? "opacity-100 scale-110 font-bold translate-x-[7%]" : "opacity-60",
                (!subLyric && !small) ? "my-10 !2xl:my-30 !xxs:my-5" : "my-0",
                (line?.isSubLyric && !small) && "text-xl 2xl:text-3xl xxs:text-xs opacity-100 mt-0 mb-10 !2xl:mb-30 xxs:mb-2",
                (line?.isSubLyric && small) && "!text-[12px] !mb-2 leading-normal",
                (!line?.isSubLyric && !small) && "xxs:text-[18px] 2xl:my-20 !xxs:my-0",
                (!line?.isSubLyric && small) && "text-[18px] !my-0 !mt-8 leading-normal",
            )}
            style={blurStyle}
        >
            {elrcValues.elrcPortions.map((portion, index) => (
                <span
                    data-time={portion.time}
                    key={index}
                    className={clsx((timestamp >= portion.time - 0.2) ? "lyric-wipe lyric-wipe-active" : "lyric-wipe", !enableLyricGlow && "lyric-glow-disabled")}
                    style={{ transitionDuration: `${portion.duration * 2}s` }}
                >
                    {portion.text}
                </span>
            ))}
            {
                subLyric && <MemoizedLrcLineRenderer line={{...line, content: subLyric, isSubLyric: true }} active={active} skipToTime={skipToTime} timestamp={timestamp} small={small} />
            }
        </p>
    );
}

function UnsyncedLyrics({ lyrics }: LyricProps) {
    const { currentSong } = usePlayerSonglist();
    const lyricsBoxRef = useRef<HTMLDivElement>(null);

    // Memoize lines array
    const lines = useMemo(() => lyrics!.split("\n"), [lyrics]);

    // ...existing useEffect...
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

