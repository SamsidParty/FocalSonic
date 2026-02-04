export enum Theme {
    System = "system",
    Light = "light",
    MatchDark = "match-dark",
    MatchLight = "match-light",
    Dark = "dark",
    Black = "black",
    OneDark = "one-dark",
    NightOwlLight = "night-owl-light",
    MarmaladeBeaver = "marmalade-beaver",
    NoctisLilac = "noctis-lilac",
    MaterialTheme = "material-theme",
    MonokaiPro = "monokai-pro",
    GithubDark = "github-dark",
    ShadesOfPurple = "shades-of-purple",
    BeardedSolarized = "bearded-solarized",
    CatppuccinMocha = "catppuccin-mocha",
    NuclearDark = "nuclear-dark",
    Achiever = "achiever",
    Dracula = "dracula",
    Discord = "discord",
    TinaciousDesign = "tinacious-design",
    VueDark = "vue-dark",
    VimDarkSoft = "vim-dark-soft",
    Classic = "classic",
}

export interface IThemeContext {
    theme: Theme
    setTheme: (theme: Theme) => void
    uiFont: string
    setUIFont: (font: string) => void
    lyricsFont: string
    setLyricsFont: (font: string) => void
    isPlayerAtTop: boolean
    setIsPlayerAtTop: (isAtTop: boolean) => void
    playerStyle: "default" | "slim" | "floating"
    setPlayerStyle: (style: "default" | "slim" | "floating") => void
    enableLyricGlow: boolean
    setEnableLyricGlow: (value: boolean) => void
    enableLyricBlur: boolean
    setEnableLyricBlur: (value: boolean) => void
    vibrancyMode: "mica" | "mica-alt" | "acrylic" | "blurbehind"
    setVibrancyMode: (mode: "mica" | "mica-alt" | "acrylic" | "blurbehind") => void
    accentColor?: string
    setAccentColor: (color: string) => void
    coverflowStyle: "modern" | "classic",
    setCoverflowStyle: (style: "modern" | "classic") => void
}
