export function stripLRCLine(lrcLine: string): string {
    // This will remove all the timestamps, and any other metadata from an LRC line
    // It will also remove all the ELRC timetags, and remove the alternate lyrics if present (seperated from main lyrics by a ⏩ character)
    let cleanLine = lrcLine.replace(/\[.*?\]/g, ""); // Remove timestamps and other metadata
    cleanLine = cleanLine.replace(/<rt>.*?<\/rt>/g, ""); // Remove rt tags

    // Remove ELRC timetags
    cleanLine = cleanLine.replace(/<\d+(?:[:.]\d+)*>/g, "");

    // Remove any alternate channels (transliteration ⏩ / translation ⏭),
    // keeping only the original text before the first channel marker.
    cleanLine = cleanLine.split(/[⏩⏭]/)[0];
    return cleanLine.trim();
}