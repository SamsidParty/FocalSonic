export function stripLRCLine(lrcLine: string): string {
    // This will remove all the timestamps, and any other metadata from an LRC line
    // It will also remove all the ELRC timetags, and remove the alternate lyrics if present (seperated from main lyrics by a \x1D character)
    let cleanLine = lrcLine.replace(/\[.*?\]/g, ""); // Remove timestamps and other metadata
    cleanLine = cleanLine.replace(/<rt>.*?<\/rt>/g, ""); // Remove rt tags

    // Remove ELRC timetags
    cleanLine = cleanLine.replace(/<\d+(?:[:.]\d+)*>/g, "");

    if (cleanLine.includes("\x1D")) {
        cleanLine = cleanLine.split("\x1D")[0]; // Remove alternate lyrics
    }
    return cleanLine.trim();
}