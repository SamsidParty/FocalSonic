import { ROUTES } from "@/routes/routesList";
import { HomeIcon, LibraryIcon, ListMusicIcon, Mic2Icon, Music2Icon, PodcastIcon, RadioIcon } from "lucide-react";
import { memo } from "react";

const ListMusic = memo(ListMusicIcon);
const Mic2 = memo(Mic2Icon);
const Music2 = memo(Music2Icon);
const Radio = memo(RadioIcon);
const Home = memo(HomeIcon);
const Library = memo(LibraryIcon);
const Podcast = memo(PodcastIcon);

export enum SidebarItems {
    Home = "home",
    Artists = "artists",
    Songs = "songs",
    Albums = "albums",
    Playlists = "playlists",
    Podcasts = "podcasts",
    Radios = "radios",
}

export const mainMenuItems = [
    {
        id: SidebarItems.Home,
        title: "sidebar.home",
        route: ROUTES.LIBRARY.HOME,
        icon: Home,
    },
];

export const libraryItems = [
    {
        id: SidebarItems.Artists,
        title: "sidebar.artists",
        route: ROUTES.LIBRARY.ARTISTS,
        icon: Mic2,
    },
    {
        id: SidebarItems.Songs,
        title: "sidebar.songs",
        route: ROUTES.LIBRARY.SONGS,
        icon: Music2,
    },
    {
        id: SidebarItems.Albums,
        title: "sidebar.albums",
        route: ROUTES.LIBRARY.ALBUMS,
        icon: Library,
    },
    {
        id: SidebarItems.Playlists,
        title: "sidebar.playlists",
        route: ROUTES.LIBRARY.PLAYLISTS,
        icon: ListMusic,
    },
    {
        id: SidebarItems.Podcasts,
        title: "sidebar.podcasts",
        route: ROUTES.LIBRARY.PODCASTS,
        icon: Podcast,
    },
    {
        id: SidebarItems.Radios,
        title: "sidebar.radios",
        route: ROUTES.LIBRARY.RADIOS,
        icon: Radio,
    },
];