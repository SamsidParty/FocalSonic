import { MouseEvent, useCallback, useMemo } from 'react'
import { podcasts } from '@/service/podcasts'
import {
  usePlayerActions,
  usePlayerIsPlaying,
  usePlayerMediaType,
  usePlayerSonglist,
} from '@/store/player.store'

interface IEpisodeProps {
  id: string
}

export function useIsEpisodePlaying({ id }: IEpisodeProps) {
  const { podcastList, currentSongIndex } = usePlayerSonglist()
  const isPlaying = usePlayerIsPlaying()
  const { isPodcast } = usePlayerMediaType()

  const isEpisodePlaying = useMemo(() => {
    if (!isPodcast) return false

    const playingEpisode = podcastList[currentSongIndex] ?? null
    if (!playingEpisode) return false

    return playingEpisode.id === id
  }, [currentSongIndex, id, isPodcast, podcastList])

  const isNotPlaying = useMemo(() => {
    return (isEpisodePlaying && !isPlaying) || !isEpisodePlaying
  }, [isEpisodePlaying, isPlaying])

  return {
    isPlaying,
    isEpisodePlaying,
    isNotPlaying,
  }
}

export function usePlayEpisode({ id }: IEpisodeProps) {
  const { setPlayPodcast, setPlayingState } = usePlayerActions()
  const { isPlaying, isEpisodePlaying } = useIsEpisodePlaying({ id })

  const handlePlayEpisode = useCallback(
    async (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      e.preventDefault()

      if (isPlaying && isEpisodePlaying) {
        setPlayingState(false)
        return
      }
      if (!isPlaying && isEpisodePlaying) {
        setPlayingState(true)
        return
      }

      const episode = await podcasts.getEpisode(id)
      if (episode) {
        const { playback } = episode
        const hasPlaybackData = playback.length > 0
        let currentProgress = hasPlaybackData ? playback[0].progress : 0
        const isCompleted = hasPlaybackData ? playback[0].completed : false

        if (hasPlaybackData && isCompleted) {
          currentProgress = 0
        }

        // Remove descriptions to avoid storing large texts
        episode.description = ''
        episode.podcast.description = ''

        setPlayPodcast([episode], 0, currentProgress)
      }
    },
    [id, isEpisodePlaying, isPlaying, setPlayPodcast, setPlayingState],
  )

  return {
    handlePlayEpisode,
  }
}
