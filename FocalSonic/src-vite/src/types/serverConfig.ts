import { SettingsOptions } from "@/app/components/settings/options";
import { ListDisplayMode } from "./listDisplayMode";

export type ExtraBarContent = "none" | "lyrics" | "queue" | "effects";

export enum AuthType {
    PASSWORD,
    TOKEN,
}

export interface IServerConfig {
    url: string
    username: string
    password: string
    protocolVersion?: string
    serverType?: string
}

export type PageViewType = "grid" | "table"

export interface IAppPages {
    showInfoPanel: boolean
    toggleShowInfoPanel: () => void
    showRadiosSection: boolean
    setshowRadiosSection: (value: boolean) => void
    artistsPageViewType: PageViewType
    setArtistsPageViewType: (type: PageViewType) => void
}

export interface IAppData extends IServerConfig {
    authType: AuthType | null
    isServerConfigured: boolean
    osType: string
    songCount: number | null
    isHydrated: boolean
}

export interface IAppActions {
    setOsType: (value: string) => void
    setUrl: (value: string) => void
    setUsername: (value: string) => void
    setPassword: (value: string) => void
    saveConfig: (data: IServerConfig) => Promise<boolean>
    removeConfig: () => void
    toggleSidebar: () => void
}

export interface IAppUpdate {
    openDialog: boolean
    setOpenDialog: (value: boolean) => void
    remindOnNextBoot: boolean
    setRemindOnNextBoot: (value: boolean) => void
}

export interface IAppRuntimeState {
    settingsDialogState: boolean
    setSettingsDialogState: (value: boolean) => void
    currentPage: SettingsOptions
    setCurrentPage: (page: SettingsOptions) => void
    logoutDialogState: boolean
    setLogoutDialogState: (value: boolean) => void
    lyricsFinderDialogState: boolean
    setLyricsFinderDialogState: (value: boolean) => void
}

export interface IAppSettings {
    enableLRCLib: boolean
    setEnableLRCLib: (value: boolean) => void
    altLyricsMode: "off" | "transliteration" | "translation"
    setAltLyricsMode: (value: "off" | "transliteration" | "translation") => void
    sidebarOpen: boolean
    setSidebarOpen: (value: boolean) => void
    extraBarContent: ExtraBarContent
    setExtraBarContent: (value: ExtraBarContent) => void
    lyricBackgroundIntensity: number
    setLyricBackgroundIntensity: (value: number) => void
    listDisplayModes: Record<string, ListDisplayMode>
    setListDisplayMode: (listName: string, mode: ListDisplayMode) => void
}

export interface IAppContext {
    data: IAppData
    settings: IAppSettings
    pages: IAppPages
    actions: IAppActions
    update: IAppUpdate
    runtimeState: IAppRuntimeState
}
