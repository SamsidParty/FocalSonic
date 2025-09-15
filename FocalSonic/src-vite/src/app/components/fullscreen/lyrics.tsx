import {
    ScrollArea,
    scrollAreaViewportSelector,
} from "@/app/components/ui/scroll-area";
import { parseTTML } from "@/lib/ttml/parser";
import { service } from "@/service/service";
import { usePlayerRef, usePlayerSonglist } from "@/store/player.store";
import { ILyric } from "@/types/responses/song";
import { isSafari } from "@/utils/osType";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { ComponentPropsWithoutRef, useEffect, useMemo, useRef, useState } from "react";
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
        queryFn: () =>
            service.lyrics.getLyrics({
                artist,
                title,
                duration,
                id,
            }),
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

    const formattedLyrics = useMemo(() => {
        if (areLyricsTTML(lyrics)) {
            return convertTTMLToLRC(lyrics!);
        }
        return lyrics || "";
    }, [lyrics]);

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
                className={clsx("h-full overflow-y-auto", !isSafari && "scroll-smooth")}
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

    if (line?.content.split("\0").length > 1) {
        subLyric = line.content.split("\0")[1];
        lyric = line.content.split("\0")[0];
    }

    const elrcValues = useMemo(() => {
        const values = {
            isElrc: elrcTestRegex.exec(lyric),
            elrcPortions: [] as any[]
        };

        if (values.isElrc) {
            let match;

            while ((match = elrcRegex.exec(lyric)) !== null) {
                const minutes = parseInt(match[1], 10);
                const seconds = parseInt(match[2], 10);
                const fractionOfSeconds = parseInt(match[3], 10);
                const totalSeconds = minutes * 60 + seconds + fractionOfSeconds / 100;

                values.elrcPortions.push({
                    Time: totalSeconds,
                    Text: match[4],
                });
            }
        }

        return values;
    }, [lyric]);


    if (elrcValues.isElrc) {
        return (
            <p
                key={line?.id}
                onClick={() => skipToTime(line.startMillisecond)}
                className={clsx(
                    "drop-shadow-lg text-white cursor-pointer hover:opacity-100 duration-700",
                    "transition-[opacity,transform] motion-reduce:transition-none ease-long text-left",
                    (active && !line?.isSubLyric) ? "opacity-100 scale-110 font-bold translate-x-[7%]" : "opacity-60",
                    !subLyric ? "my-10 2xl:my-20" : "my-0",
                    line?.isSubLyric && "text-xl 2xl:text-3xl opacity-100 mt-0 2xl:mt-0 mb-10 2xl:mb-20"
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

    // Regular LRC
    return (
        <p
            key={line?.id}
            onClick={() => skipToTime(line.startMillisecond)}
            className={clsx(
                "drop-shadow-lg my-10 2xl:my-20 text-white cursor-pointer hover:opacity-100 duration-700",
                "transition-[opacity,transform] motion-reduce:transition-none ease-long text-left",
                active ? "opacity-100 scale-110 font-bold translate-x-[7%]" : "opacity-60",
            )}
        >
            {line?.content}
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
    return lyric.startsWith("<tt xmlns=");
}

function convertTTMLToLRC(ttml: string): string {
    try {
        const parsedTTML = parseTTML(ttml);

        const enableELRC = true;
        const enableTransliteration = true;

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
                if (enableTransliteration && line.words.filter((f) => f.word && f.romanWord).length > 0) {
                    output +=
                        (line.words.map((word) => word.word?.replaceAll(" ", "").trim()).join("") !== line.words.map((word) => word.romanWord?.replaceAll(" ", "").trim()).join("")) // Skip if word and romanWord are same
                            ? `\0${line.words.map((word) => convertMS(word.startTime, true) + (word.romanWord)).join(" ")}`
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