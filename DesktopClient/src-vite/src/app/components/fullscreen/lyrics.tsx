import {
  ScrollArea,
  scrollAreaViewportSelector,
} from '@/app/components/ui/scroll-area'
import { subsonic } from '@/service/subsonic'
import { usePlayerRef, usePlayerSonglist } from '@/store/player.store'
import { ILyric } from '@/types/responses/song'
import { isSafari } from '@/utils/osType'
import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { ComponentPropsWithoutRef, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Lrc } from 'react-lrc'

interface LyricProps {
  lyrics: ILyric,
  leftAlign?: boolean
}

export function LyricsTab({ leftAlign }: { leftAlign?: boolean }) {
  const { currentSong } = usePlayerSonglist()
  const { t } = useTranslation()

  const { artist, title, duration, id } = currentSong

  const { data: lyrics, isLoading } = useQuery({
    queryKey: ['get-lyrics', artist, title, duration],
    queryFn: () =>
      subsonic.lyrics.getLyrics({
        artist,
        title,
        duration,
        id,
      }),
  })

  const noLyricsFound = t('fullscreen.noLyrics')
  const loadingLyrics = t('fullscreen.loadingLyrics')

  if (isLoading) {
    return <CenteredMessage>{loadingLyrics}</CenteredMessage>
  } else if (lyrics && lyrics.value) {
    return areLyricsSynced(lyrics) ? (
      <SyncedLyrics leftAlign={leftAlign} lyrics={lyrics} />
    ) : (
      <UnsyncedLyrics leftAlign={leftAlign} lyrics={lyrics} />
    )
  } else {
    return <CenteredMessage>{noLyricsFound}</CenteredMessage>
  }
}

function SyncedLyrics({ lyrics, leftAlign }: LyricProps) {
  const playerRef = usePlayerRef()
  const [timestamp, setTimestamp] = useState<number>(0);

  requestAnimationFrame(() => {
      let newTimestamp = (playerRef?.currentTime || 0) * 1000;

      if (newTimestamp !== timestamp) {
          setTimestamp(newTimestamp);
      }
      else {
          setTimestamp(newTimestamp + 1);
      }
  });

  const skipToTime = (timeMs: number) => {
    if (playerRef) {
      playerRef!.currentTime = timeMs / 1000
    }
  }

  return (
    <div className="w-full h-full text-center font-semibold text-4xl 2xl:text-3xl px-2 lrc-box maskImage-big-player-lyrics">
      <Lrc
        lrc={lyrics.value!}
        recoverAutoScrollInterval={1500}
        currentMillisecond={timestamp}
        id={"sync-lyrics-box-" + (leftAlign ? "left" : "center")}
        className={clsx('h-full overflow-y-auto', !isSafari && 'scroll-smooth')}
        verticalSpace={true}
        lineRenderer={({ active, line }) => (
          <p
            onClick={() => skipToTime(line.startMillisecond)}
            className={clsx(
              'drop-shadow-lg my-10 cursor-pointer hover:opacity-100 duration-700',
              'transition-[opacity,transform] motion-reduce:transition-none ease-long',
              active ? 'opacity-100 scale-110' : 'opacity-60',
              leftAlign ? 'text-left' : 'text-center',
              (leftAlign && active) ? 'translate-x-[7%]' : '',
            )}
          >
            {line.content}
          </p>
        )}
      />
    </div>
  )
}

function UnsyncedLyrics({ lyrics }: LyricProps) {
  const { currentSong } = usePlayerSonglist()
  const lyricsBoxRef = useRef<HTMLDivElement>(null)

  const lines = lyrics.value!.split('\n')

  useEffect(() => {
    if (lyricsBoxRef.current) {
      const scrollArea = lyricsBoxRef.current.querySelector(
        scrollAreaViewportSelector,
      ) as HTMLDivElement

      scrollArea.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    }
  }, [currentSong])

  return (
    <ScrollArea
      type="always"
      className="w-full h-full overflow-y-auto text-center font-semibold text-xl 2xl:text-2xl px-2 scroll-smooth"
      thumbClassName="secondary-thumb-bar"
      ref={lyricsBoxRef}
    >
      {lines.map((line, index) => (
        <p
          key={index}
          className={clsx(
            'leading-10 drop-shadow-lg text-balance',
            index === 0 && 'mt-6',
            index === lines.length - 1 && 'mb-10',
          )}
        >
          {line}
        </p>
      ))}
    </ScrollArea>
  )
}

type CenteredMessageProps = ComponentPropsWithoutRef<'p'>

function CenteredMessage({ children }: CenteredMessageProps) {
  return (
    <div className="w-full h-full flex justify-center items-center">
      <p className="leading-10 drop-shadow-lg text-center font-semibold text-xl 2xl:text-2xl">
        {children}
      </p>
    </div>
  )
}

function areLyricsSynced(lyrics: ILyric) {
  // Most LRC files start with the string "[00:" or "[01:" indicating synced lyrics
  const lyric = lyrics.value?.trim() ?? ''
  return (
    lyric.startsWith('[00:') ||
    lyric.startsWith('[01:') ||
    lyric.startsWith('[02:')
  )
}
