import {
    ScrollArea,
    scrollAreaViewportSelector,
} from "@/app/components/ui/scroll-area";
import { parseTTML } from "@/lib/ttml/parser";
import { service } from "@/service/service";
import { useAppStore } from "@/store/app.store";
import { usePlayerRef, usePlayerSonglist } from "@/store/player.store";
import { usePlayerStyle } from "@/store/theme.store";
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
    leftAlign?: boolean
}

export function LyricsTab({ leftAlign }: { leftAlign?: boolean }) {
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
            <SyncedLyrics leftAlign={leftAlign} lyrics={lyrics} />
        ) : (
            <UnsyncedLyrics leftAlign={leftAlign} lyrics={lyrics} />
        );
    } else {
        return <CenteredMessage>{noLyricsFound}</CenteredMessage>;
    }
}

function SyncedLyrics({ lyrics, leftAlign }: LyricProps) {
    const playerRef = usePlayerRef();
    const [timestamp, setTimestamp] = useState<number>(0);
    const { altLyricsMode } = useAppStore().settings;
    const { isMiniPlayer } = usePlayerStyle();


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
            if (altLyricsMode === "translation") {
                const lines = lyrics!.split("\n");
                let needsTranslation = false;

                for (const line of lines) {
                    const parts = line.split("\x1D");
                    const mainLyric = parts[0] || "";
                    const altLyric = parts[1] || "";

                    // Check if mainLyric has non-latin characters
                    if (/[^\u0000-\u007F]/.test(mainLyric)) {
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
                        translatedMonolith += strippedLine + "\n";
                    }


                    // Translate as one block because multiple requests can get throttled
                    translatedMonolith = (await translateText(translatedMonolith.trim(), "en")) || "";

                    // Reintegrate translated lines back into LRC format
                    const translatedLines = translatedMonolith.split("\n");
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

    requestAnimationFrame(() => {
        const newTimestamp = (playerRef?.currentTime || 0) * 1000;

        if (newTimestamp !== timestamp) {
            setTimestamp(newTimestamp);
        }
        else {
            setTimestamp(newTimestamp + 1);
        }
    });

    const skipToTime = (timeMs: number) => {
        if (playerRef) {
            playerRef!.currentTime = timeMs / 1000;
        }
    };

    return (
        <div className="w-full h-full text-center font-semibold text-4xl 2xl:text-6xl px-2 lrc-box font-lyrics maskImage-big-player-lyrics">
            <Lrc
                lrc={formattedLyrics!}
                recoverAutoScrollInterval={1000}
                currentMillisecond={timestamp}
                id={"sync-lyrics-box-" + (leftAlign ? "left" : "center")}
                className={clsx("h-full overflow-y-auto z-40", !isSafari && "scroll-smooth")}
                verticalSpace={true}
                lineRenderer={(props) => <LrcLineRenderer {...props} skipToTime={skipToTime} timestamp={timestamp / 1000} />}
            />
        </div>
    );
}

function LrcLineRenderer({ line, active, skipToTime, timestamp }: { line: LrcLine, active: boolean, skipToTime: (time: number) => void, timestamp: number }) {

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
            const minutes = parseInt(match[1], 10);
            const seconds = parseInt(match[2], 10);
            const fractionOfSeconds = parseInt(match[3], 10);
            const totalSeconds = minutes * 60 + seconds + fractionOfSeconds / 100;

            values.elrcPortions.push({
                Time: totalSeconds,
                Text: match[4],
            });
        }
        
        return values;
    }, [lyric]);


    return (
        <p
            key={line?.id}
            onClick={() => skipToTime(line.startMillisecond)}
            className={clsx(
                "drop-shadow-lg z-40 text-white cursor-pointer hover:opacity-100 duration-700",
                "transition-[opacity,transform] motion-reduce:transition-none ease-long text-left xxs:leading-normal",
                (active && !line?.isSubLyric) ? "opacity-100 scale-110 font-bold translate-x-[7%]" : "opacity-60",
                !subLyric ? "my-10 2xl:my-20 xxs:my-5" : "my-0",
                line?.isSubLyric && "text-xl 2xl:text-3xl xxs:text-xs opacity-100 mt-0 mb-10 2xl:mb-20 xxs:mb-2",
                !line?.isSubLyric && "xxs:text-[18px]",
            )}
        >
            {elrcValues.elrcPortions.map((portion, index) => (
                <span
                    data-time={portion.Time}
                    key={index}
                    className={(timestamp >= portion.Time - 0.2) ? "opacity-100 transition-opacity duration-200" : "opacity-40"}
                >
                    {portion.Text}
                </span>
            ))}
            {
                subLyric && <LrcLineRenderer line={{...line, content: subLyric, isSubLyric: true }} active={active} skipToTime={skipToTime} timestamp={timestamp} />
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