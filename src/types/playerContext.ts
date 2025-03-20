import { EpisodeWithPodcast } from './responses/podcasts'
import { Radio } from './responses/radios'
import { ISong } from './responses/song'

export enum LoopState {
  Off = 0,
  All = 1,
  One = 2,
}

export interface ISongList {
  shuffledList: ISong[]
  currentList: ISong[]
  currentSongIndex: number
  currentSong: ISong
  originalList: ISong[]
  originalSongIndex: number
  radioList: Radio[]
  podcastList: EpisodeWithPodcast[]
}

export interface IPlayerState {
  isPlaying: boolean
  loopState: LoopState
  isShuffleActive: boolean
  isSongStarred: boolean
  volume: number
  currentDuration: number
  mediaType: 'song' | 'radio' | 'podcast'
  currentPlaybackRate: number
  audioPlayerRef: HTMLAudioElement | null
  mainDrawerState: boolean
  queueState: boolean
  lyricsState: boolean
  hasPrev: boolean
  hasNext: boolean
  currentSongColor: string | null
  useSongColorOnQueue: boolean
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

export type ReplayGainType = 'track' | 'album'

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

interface IFullscreen {
  autoFullscreenEnabled: boolean
  setAutoFullscreenEnabled: (value: boolean) => void
}

interface ILyrics {
  preferSyncedLyrics: boolean
  setPreferSyncedLyrics: (value: boolean) => void
}

export interface IPrivacySettings {
  lrcLibEnabled: boolean
  setLrcLibEnabled: (value: boolean) => void
}

export interface IPlayerSettings {
  volume: IVolumeSettings
  fullscreen: IFullscreen
  lyrics: ILyrics
  replayGain: IReplayGain
  privacy: IPrivacySettings
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
  resetProgress: () => void
  setProgress: (progress: number) => void
  setVolume: (volume: number) => void
  handleVolumeWheel: (isScrollingDown: boolean) => void
  setCurrentDuration: (duration: number) => void
  setPlayRadio: (list: Radio[], index: number) => void
  setAudioPlayerRef: (ref: HTMLAudioElement) => void
  setNextOnQueue: (songlist: ISong[]) => void
  setLastOnQueue: (songlist: ISong[]) => void
  removeSongFromQueue: (id: string) => void
  setMainDrawerState: (state: boolean) => void
  setQueueState: (state: boolean) => void
  setLyricsState: (state: boolean) => void
  toggleQueueAndLyrics: () => void
  closeDrawer: () => void
  playFirstSongInQueue: () => void
  handleSongEnded: () => void
  getCurrentProgress: () => number
  resetConfig: () => void
  setPlayPodcast: (list: EpisodeWithPodcast[], index: number) => void
  setUpdatePodcastProgress: (value: number) => void
  setPlaybackRate: (value: number) => void
  setNextPodcast: (episode: EpisodeWithPodcast) => void
  setLastPodcast: (episode: EpisodeWithPodcast) => void
  updateQueueChecks: () => void
  setCurrentSongColor: (value: string | null) => void
  setUseSongColorOnQueue: (value: boolean) => void
}

export interface IPlayerContext {
  songlist: ISongList
  playerState: IPlayerState
  playerProgress: IPlayerProgress
  settings: IPlayerSettings
  actions: IPlayerActions
}
