import {
    ScrollArea,
    scrollAreaViewportSelector,
} from "@/app/components/ui/scroll-area";
import { parseTTML } from "@/lib/ttml/parser";
import { service } from "@/service/service";
import { useAppStore } from "@/store/app.store";
import { usePlayerRef, usePlayerSonglist } from "@/store/player.store";
import { usePlayerStyle, useTheme } from "@/store/theme.store";
import { ILyric } from "@/types/responses/song";
import { stripLRCLine } from "@/utils/lyricUtils";
import { isSafari } from "@/utils/osType";
import { translateText } from "@/utils/translate";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import React, { ComponentPropsWithoutRef, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Lrc, LrcLine } from "react-lrc";

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

    let { lyrics, leftAlign, small } = props;


    const { data: convertedLyrics, isLoading } = useQuery({
        queryKey: ["convert-and-translate-lyrics", lyrics, altLyricsMode],
        queryFn: async () =>
        {
            if (areLyricsTTML(lyrics)) {
                lyrics = convertTTMLToLRC(lyrics!, altLyricsMode);
            }

            // Determine if auto translation is needed
            // When altLyricsMode is 'translation', each LRC line has two parts separated by a '\x1D' character.
            // For every line, check if it's non-latin. If it is, check if the second part is empty
            // If all non-latin lines have empty second parts, we need to translate
            if (altLyricsMode === "translation" || altLyricsMode === "transliteration") {
                const lines = lyrics!.split("\n");
                let needsTranslation = false;

                for (const line of lines) {
                    const parts = line.split("\x1D");
                    const mainLyric = parts[0] || "";
                    const altLyric = parts[1] || "";

                    // Check if mainLyric has non-latin characters
                    if (/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Devanagari}\p{Script=Bengali}\p{Script=Gurmukhi}\p{Script=Gujarati}\p{Script=Oriya}\p{Script=Tamil}\p{Script=Telugu}\p{Script=Kannada}\p{Script=Malayalam}\p{Script=Sinhala}\p{Script=Thai}\p{Script=Khmer}\p{Script=Lao}\p{Script=Myanmar}\p{Script=Ethiopic}\p{Script=Georgian}\p{Script=Armenian}\p{Script=Cherokee}\p{Script=Yi}]/u.test(mainLyric)) {
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
                        translatedMonolith += strippedLine + "\n⁜"; // Use a rare character as line separator to survive translation
                    }


                    // Translate as one block because multiple requests can get throttled
                    translatedMonolith = (await translateText(translatedMonolith.trim(), altLyricsMode === "transliteration" ? "ja" : "en", altLyricsMode === "transliteration")) || "";

                    // Reintegrate translated lines back into LRC format
                    const translatedLines = translatedMonolith.split("⁜");
                    const finalLyricsLines = lyrics!.split("\n").map((line, index) => {
                        const altLyric = translatedLines[index] || "";
                        return line.split("\x1D")[0] + `\x1D<00:00.00>${altLyric}<00:00.00>`; // Append dummy ELRC tag to translated part
                    });

                    lyrics = finalLyricsLines.join("\n");
                }
            }

            return lyrics;
        },
    });

    const formattedLyrics = useMemo(() => {
        return convertedLyrics || "";
    }, [altLyricsMode, convertedLyrics]);

    if (props.visible) {
        requestAnimationFrame(() => {
            const newTimestamp = (playerRef?.currentTime || 0) * 1000;

            if (newTimestamp !== timestamp) {
                setTimestamp(newTimestamp);
            }
            else {
                setTimestamp(newTimestamp + 1);
            }
        });
    }


    const skipToTime = (timeMs: number) => {
        if (playerRef) {
            playerRef!.currentTime = timeMs / 1000;
        }
    };

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
                lrc={formattedLyrics!}
                recoverAutoScrollInterval={1000}
                currentMillisecond={timestamp}
                id={"sync-lyrics-box-" + (leftAlign ? "left" : "center")}
                className={clsx("h-full overflow-y-auto z-40", !isSafari && "scroll-smooth")}
                onLineUpdate={(l) => currentLineNumber = l?.index}
                verticalSpace={true}
                lineRenderer={(_props) => <LrcLineRenderer {..._props} {...props} skipToTime={skipToTime} timestamp={timestamp / 1000} />}
            />
        </div>
    );
}

function LrcLineRenderer({ line, active, skipToTime, timestamp, small }: { line: LrcLine, active: boolean, skipToTime: (time: number) => void, timestamp: number, small?: boolean }) {

    const { enableLyricBlur, enableLyricGlow } = useTheme();

    const elrcRegex = /<(\d{2}):(\d{2})\.(\d{2})>([^<]+)/g;
    const elrcTestRegex = /^\s*(<\d{2}:\d{2}\.\d+>[^<]*)+\s*$/;
    let subLyric: string = null;
    let lyric = line?.content;

    if (line?.content.split("\x1D").length > 1) {
        subLyric = line.content.split("\x1D")[1];
        lyric = line.content.split("\x1D")[0];
    }

    const elrcValues = useMemo(() => {
        const values = {
            isElrc: elrcTestRegex.exec(lyric),
            elrcPortions: [] as any[]
        };

        const displayLyric = values.isElrc ? lyric : `\x1D<00:00.00>${lyric}<00:00.00>`;

        let match;

        while ((match = elrcRegex.exec(displayLyric)) !== null) {
            const lastElement = values.elrcPortions[values.elrcPortions.length - 1];
            const minutes = parseInt(match[1], 10);
            const seconds = parseInt(match[2], 10);
            const fractionOfSeconds = parseInt(match[3], 10);
            const totalSeconds = minutes * 60 + seconds + fractionOfSeconds / 100;

            if (totalSeconds > 0.05 || !lastElement) {
                values.elrcPortions.push({
                    time: Math.max(totalSeconds, 0),
                    text: match[4],
                });
            }
            else {
                lastElement && (lastElement.text += match[4]);
            }
        }

        // Handle case with unsynced lyrics
        if (values.elrcPortions.length === 1 && values.elrcPortions[0].time === 0) {
            values.elrcPortions[0].time = line.startMillisecond / 1000; // Set to line start time
            values.elrcPortions[0].duration = 0.3;
        }

        // Calculate the duration for each portion
        for (let i = 0; i < values.elrcPortions.length; i++) {
            if (i < values.elrcPortions.length - 1) {
                values.elrcPortions[i].duration = (values.elrcPortions[i + 1].time - values.elrcPortions[i].time);
            } else {
                values.elrcPortions[i].duration = 0.3; // Default duration for the last portion
            }
        }
        
        return values;
    }, [lyric]);

    // Calculate the distance from the active line
    let timeDiff = Math.abs((currentLineNumber || 0) - line.lineNumber);
    if (timeDiff > 5) timeDiff = 5; // Cap the difference to avoid excessive blur recalculation
    if (active || small || !enableLyricBlur) timeDiff = 0;


    return (
        <p
            key={line?.id}
            onClick={() => skipToTime(line.startMillisecond)}
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
            style={{
                filter: `blur(${timeDiff*1.2}px)`
            }}
        >
            {elrcValues.elrcPortions.map((portion, index) => (
                <span
                    data-time={portion.Time}
                    key={index}
                    className={clsx((timestamp >= portion.time - 0.2) ? "lyric-wipe lyric-wipe-active" : "lyric-wipe", !enableLyricGlow && "lyric-glow-disabled")}
                    style={{ transitionDuration: `${portion.duration * 2}s` }}
                >
                    {portion.text}
                </span>
            ))}
            {
                subLyric && <LrcLineRenderer line={{...line, content: subLyric, isSubLyric: true }} active={active} skipToTime={skipToTime} timestamp={timestamp} small={small} />
            }
        </p>
    );

}

function UnsyncedLyrics({ lyrics }: LyricProps) {
    const { currentSong } = usePlayerSonglist();
    const lyricsBoxRef = useRef<HTMLDivElement>(null);

    const lines = lyrics!.split("\n");

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

function areLyricsSynced(lyrics: ILyric) {
    // Most LRC files start with the string "[00:" or "[01:" indicating synced lyrics
    const lyric = lyrics?.trim() ?? "";
    return (
        lyric.startsWith("[00:") ||
        lyric.startsWith("[01:") ||
        lyric.startsWith("[02:") ||
        areLyricsTTML(lyrics)
    );
}

function areLyricsTTML(lyrics: ILyric) {
    const lyric = lyrics?.trim() ?? "";
    return lyric.startsWith("<tt");
}

function convertTTMLToLRC(ttml: string, altMode: "off" | "transliteration" | "translation"): string {
    try {
        const parsedTTML = parseTTML(ttml);

        const enableELRC = true;
        const enableAltLyrics = altMode != "off";

        const convertedELRC = parsedTTML.lyricLines.map((line) => {

            let output = "";

            const convertMS = (ms, wrap?: boolean) => {
                const minutes = Math.floor(ms / 60000);
                const remainingMsAfterMinutes = ms % 60000;
                const seconds = Math.floor(remainingMsAfterMinutes / 1000);
                const milliseconds = remainingMsAfterMinutes % 1000;
                const formattedMinutes = String(minutes).padStart(2, "0");
                const formattedSeconds = String(seconds).padStart(2, "0");
                const formattedMilliseconds = String(milliseconds).padStart(3, "0");

                if (wrap) {
                    return `<${formattedMinutes}:${formattedSeconds}.${formattedMilliseconds.substring(0, 2)}>`;
                }

                return `${formattedMinutes}:${formattedSeconds}.${formattedMilliseconds}`;
            };

            if (enableELRC) {
                output += `[${convertMS(line.startTime)}] ${line.words.map((word) => convertMS(word.startTime, true) + (word.word)).join("")}`;

                if (enableAltLyrics && line.words.filter((f) => f.word && f["altWord_" + altMode]).length > 0) {
                    output +=
                        (line.words.map((word) => word.word?.replaceAll(" ", "").trim()).join("") !== line.words.map((word) => word["altWord_" + altMode]?.replaceAll(" ", "").trim()).join("")) // Skip if word and alternate word are same
                            ? `\x1D${line.words.map((word) => convertMS(word.startTime, true) + (word["altWord_" + altMode])).join(" ")}`
                            : "";
                }
            }
            else {
                output += `[${convertMS(line.startTime)}]${line.words.map((word) => word.word).join("")}`;
            }

            return output;

        }).join("\n");

        return convertedELRC;
    }
    catch (error) {
        console.error("Error parsing TTML:", error);
    }

    return ttml;
}