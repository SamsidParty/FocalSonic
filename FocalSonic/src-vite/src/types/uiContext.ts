export type InfoItemType = "song" | "album" | "artist" | "playlist"

export interface IInfoItemTarget {
    type: InfoItemType
    id: string
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
