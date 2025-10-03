export interface TTMLMetadata {
    key: string;
    value: string[];
}

export interface TTMLLyric {
    metadata: TTMLMetadata[];
    lyricLines: LyricLine[];
}

export interface LyricWord {
    startTime: number;
    endTime: number;
    word: string;
    itunesKey?: string;
    emptyBeat?: number;
    altWord_transliteration?: string;
    altWord_translation?: string;
}

export interface LyricLine {
    words: LyricWord[];
    itunesKey?: string;
    isBG: boolean;
    isDuet: boolean;
    startTime: number;
    endTime: number;
    altLyric_transliteration?: string;
    altLyric_translation?: string;
}