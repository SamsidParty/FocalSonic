import { useQuery } from '@tanstack/react-query'
import { Fragment } from 'react/jsx-runtime'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import ImageHeader from '@/app/components/album/image-header'
import { PlaylistFallback } from '@/app/components/fallbacks/playlist-fallbacks'
import ListWrapper from '@/app/components/list-wrapper'
import { PlaylistButtons } from '@/app/components/playlist/buttons'
import { RemoveSongFromPlaylistDialog } from '@/app/components/playlist/remove-song-dialog'
import { Badge } from '@/app/components/ui/badge'
import { DataTable } from '@/app/components/ui/data-table'
import ErrorPage from '@/app/pages/error-page'
import { songsColumns } from '@/app/tables/songs-columns'
import { subsonic } from '@/service/subsonic'
import { usePlayerActions } from '@/store/player.store'
import { ColumnFilter } from '@/types/columnFilter'
import { convertSecondsToHumanRead } from '@/utils/convertSecondsToTime'
import { queryKeys } from '@/utils/queryKeys'

export default function Playlist() {
  const { playlistId } = useParams() as { playlistId: string }
  const { t } = useTranslation()
  const columns = songsColumns()
  const { setSongList } = usePlayerActions()

  const {
    data: playlist,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: [queryKeys.playlist.single, playlistId],
    queryFn: () => subsonic.playlists.getOne(playlistId),
  })

  if (isFetching || isLoading) return <PlaylistFallback />
  if (!playlist) return <ErrorPage status={404} statusText="Not Found" />

  const columnsToShow: ColumnFilter[] = [
    'index',
    'title',
    'artist',
    'album',
    'duration',
    'playCount',
    'contentType',
    'select',
  ]

  const songCount = t('playlist.songCount', { count: playlist.songCount })
  const duration = convertSecondsToHumanRead(playlist.duration)
  const playlistDuration = t('playlist.duration', { duration })

  const badges = (
    <Fragment>
      <Badge variant="secondary">{songCount}</Badge>
      {playlist.duration > 0 && (
        <Badge variant="secondary">{playlistDuration}</Badge>
      )}
    </Fragment>
  )

  const coverArt = playlist.songCount > 0 ? playlist.coverArt : undefined

  return (
    <div className="w-full" key={playlist.id}>
      <ImageHeader
        type={t('playlist.headline')}
        title={playlist.name}
        subtitle={playlist.comment}
        coverArtId={coverArt}
        coverArtType="album"
        coverArtSize="700"
        coverArtAlt={playlist.name}
        badges={badges}
        isPlaylist={true}
      />

      <ListWrapper>
        <PlaylistButtons playlist={playlist} />

        <DataTable
          columns={columns}
          data={playlist.entry ?? []}
          handlePlaySong={(row) => setSongList(playlist.entry, row.index)}
          columnFilter={columnsToShow}
          noRowsMessage={t('playlist.noSongList')}
          variant="modern"
        />

        <RemoveSongFromPlaylistDialog />
      </ListWrapper>
    </div>
  )
}
