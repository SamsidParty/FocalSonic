import { AppleMusicStationDisplay } from "./applemusic/common";
import { Radio } from "./responses/radios";
import { ISong } from "./responses/song";

export enum LoopState {
    Off = 0,
    All = 1,
    One = 2,
    InfiniteRadio = 3
}

export interface ISongList {
    shuffledList: ISong[]
    currentList: ISong[]
    currentSongIndex: number
    currentSong: ISong
    originalList: ISong[]
    originalSongIndex: number
    radioList: Radio[]
    currentRadioID: string | null // For apple music stations
    currentRadioStation: AppleMusicStationDisplay | null
}

export interface IPlayerState {
    isPlaying: boolean
    loopState: LoopState
    isShuffleActive: boolean
    isSongStarred: boolean
    volume: number
    speed: number
    filterData: string
    currentDuration: number
    mediaType: "song" | "radio"
    audioPlayerRef: HTMLAudioElement | null
    mainDrawerState: boolean
    hasPrev: boolean
    hasNext: boolean
}

export interface IPlayerProgress {
    progress: number
}

export interface IVolumeSettings {
    min: number
    max: number
    step: number
    wheelStep: number
}

export interface ISpeedSettings {
    min: number
    max: number
    step: number
    wheelStep: number
}

export type ReplayGainType = "track" | "album"

interface IReplayGainData {
    enabled: boolean
    type: ReplayGainType
    preAmp: number
    error: boolean
    defaultGain: number
}

interface IReplayGainActions {
    setReplayGainEnabled: (value: boolean) => void
    setReplayGainType: (value: ReplayGainType) => void
    setReplayGainPreAmp: (value: number) => void
    setReplayGainError: (value: boolean) => void
    setReplayGainDefaultGain: (value: number) => void
}

interface IReplayGain {
    values: IReplayGainData
    actions: IReplayGainActions
}

interface IBlurSettings {
    value: number
    settings: {
        min: number
        max: number
        step: number
    }
}

interface IBigPlayerSettings {

    blur: IBlurSettings
}


interface IColorsSettings {
    currentSongColor: string | null
    bigPlayer: IBigPlayerSettings
}

export interface IPlayerSettings {
    volume: IVolumeSettings
    speed: ISpeedSettings
    replayGain: IReplayGain
    colors: IColorsSettings
}

export interface IPlayerActions {
    playSong: (song: ISong) => void
    setSongList: (songlist: ISong[], index: number, shuffle?: boolean) => void
    setCurrentSong: () => void
    checkIsSongStarred: () => void
    starSongInQueue: (id: string) => void
    starCurrentSong: () => Promise<void>
    setPlayingState: (status: boolean) => void
    togglePlayPause: () => void
    toggleLoop: () => void
    toggleShuffle: () => void
    checkActiveSong: (id: string) => boolean
    playNextSong: () => void
    playPrevSong: () => void
    hasNextSong: () => boolean
    hasPrevSong: () => boolean
    isPlayingOneSong: () => boolean
    clearPlayerState: () => void
    disposePlayer: () => void
    resetProgress: () => void
    setProgress: (progress: number) => void
    setVolume: (volume: number) => void
    setSpeed: (speed: number) => void
    setFilterData: (data: string) => void
    handleVolumeWheel: (isScrollingDown: boolean) => void
    setCurrentDuration: (duration: number) => void
    setPlayRadio: (list: Radio[], index: number) => void
    setPlayAppleMusicRadio: (station: any) => void
    setAudioPlayerRef: (ref: HTMLAudioElement) => void
    setNextOnQueue: (songlist: ISong[]) => void
    setLastOnQueue: (songlist: ISong[]) => void
    moveSongInQueue: (fromIndex: number, toIndex: number) => void
    removeSongFromQueue: (id: string) => void
    setMainDrawerState: (state: boolean) => void
    closeDrawer: () => void
    playFirstSongInQueue: () => void
    handleSongEnded: () => void
    getCurrentProgress: () => number
    resetConfig: () => void
    updateQueueChecks: () => void
    setCurrentSongColor: (value: string | null) => void
    setBigPlayerBlurValue: (value: number) => void
    setIsLoading: (value: boolean) => void
    setPresenceNonce: (value: number) => void
}

export interface IPlayerContext {
    isLoading: boolean
    songlist: ISongList
    playerState: IPlayerState
    playerProgress: IPlayerProgress
    settings: IPlayerSettings
    actions: IPlayerActions
    playerCallbackData: Record<string, string>
    presenceNonce: number
}
