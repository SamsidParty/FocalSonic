import { Albums, SingleAlbum } from "./responses/album";
import { IArtist, ISimilarArtist } from "./responses/artist";
import { Playlist, PlaylistWithEntries } from "./responses/playlist";
import { ISong } from "./responses/song";

export type InfoItemType = "song" | "album" | "artist" | "playlist"

export type InfoPlaylistItem = Partial<Playlist> & {
    id: string
    name: string
}

export type InfoItemData =
    | ISong
    | Albums
    | SingleAlbum
    | IArtist
    | ISimilarArtist
    | Playlist
    | PlaylistWithEntries
    | InfoPlaylistItem

export interface IInfoItemTarget {
    type: InfoItemType
    id: string
    item?: InfoItemData
}

interface IItemInfo {
    target: IInfoItemTarget | null
    setTarget: (target: IInfoItemTarget | null) => void
    modalOpen: boolean
    setModalOpen: (open: boolean) => void
    openInfo: (target: IInfoItemTarget) => void
    reset: () => void
}

export interface IUiContext {
    itemInfo: IItemInfo
}
