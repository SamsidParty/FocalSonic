import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Actions } from '@/app/components/actions'
import { usePlayerActions } from '@/store/player.store'
import { PlaylistWithEntries } from '@/types/responses/playlist'
import { PlaylistOptions } from './options'
import { RemovePlaylistDialog } from './remove-dialog'

interface PlaylistButtonsProps {
  playlist: PlaylistWithEntries
}

export function PlaylistButtons({ playlist }: PlaylistButtonsProps) {
  const { t } = useTranslation()
  const { setSongList } = usePlayerActions()
  const [removeDialogState, setRemoveDialogState] = useState(false)

  const buttonsTooltips = {
    play: t('playlist.buttons.play', { name: playlist.name }),
    shuffle: t('playlist.buttons.shuffle', { name: playlist.name }),
    options: t('playlist.buttons.options', { name: playlist.name }),
  }

  return (
    <Actions.Container>
      <Actions.Button
        tooltip={buttonsTooltips.play}
        buttonStyle="primary"
        onClick={() => setSongList(playlist.entry, 0)}
        disabled={!playlist.entry}
      >
        <Actions.PlayIcon />
      </Actions.Button>

      <Actions.Button
        tooltip={buttonsTooltips.shuffle}
        onClick={() => setSongList(playlist.entry, 0, true)}
        disabled={!playlist.entry}
      >
        <Actions.ShuffleIcon />
      </Actions.Button>

      <Actions.Dropdown
        tooltip={buttonsTooltips.options}
        options={
          <PlaylistOptions
            playlist={playlist}
            onRemovePlaylist={() => setRemoveDialogState(true)}
            disablePlayNext={!playlist.entry}
            disableAddLast={!playlist.entry}
            disableDownload={!playlist.entry}
          />
        }
      />

      <RemovePlaylistDialog
        playlistId={playlist.id}
        openDialog={removeDialogState}
        setOpenDialog={setRemoveDialogState}
      />
    </Actions.Container>
  )
}
