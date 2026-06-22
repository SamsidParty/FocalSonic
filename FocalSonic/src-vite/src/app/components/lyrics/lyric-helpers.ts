import { parseTTML } from "@/lib/ttml";

export function areLyricsSynced(lyrics?: string) {
    // Most LRC files start with the string "[00:" or "[01:" indicating synced lyrics
    const lyric = lyrics?.trim() ?? "";
    return (
        lyric.startsWith("[00:") ||
        lyric.startsWith("[01:") ||
        lyric.startsWith("[02:") ||
        areLyricsTTML(lyrics)
    );
}

export function areLyricsTTML(lyrics?: string) {
    const lyric = lyrics?.trim() ?? "";
    return lyric.startsWith("<tt");
}

export function convertTTMLToLRC(ttml: string, altMode: "off" | "transliteration" | "translation"): string {
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
                            ? `⏩${line.words.map((word) => convertMS(word.startTime, true) + (word["altWord_" + altMode])).join(" ")}`
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