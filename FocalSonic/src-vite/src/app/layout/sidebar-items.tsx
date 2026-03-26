import { ROUTES } from "@/routes/routesList";
import { canUseRadiosLibrary, checkServerType } from "@/utils/servers";
import { HomeIcon, LibraryIcon, ListMusicIcon, Mic2Icon, Music2Icon, Pin, RadioIcon, Search } from "lucide-react";

export enum SidebarItems {
    Search = "search",
    Home = "home",
    Artists = "artists",
    Pins = "pins",
    Songs = "songs",
    Albums = "albums",
    Playlists = "playlists",
    Radios = "radios",
}

export const mainMenuItems = [
    {
        id: SidebarItems.Search,
        title: "sidebar.search",
        route: ROUTES.LIBRARY.SEARCH,
        icon: Search,
    },
    {
        id: SidebarItems.Home,
        title: "sidebar.home",
        route: ROUTES.LIBRARY.HOME,
        icon: HomeIcon,
    },
];

export const libraryItems = [
    {
        id: SidebarItems.Songs,
        title: "sidebar.songs",
        route: ROUTES.LIBRARY.SONGS,
        icon: Music2Icon,
    },
    {
        id: SidebarItems.Albums,
        title: "sidebar.albums",
        route: ROUTES.LIBRARY.ALBUMS,
        icon: LibraryIcon,
    },
    {
        id: SidebarItems.Playlists,
        title: "sidebar.playlists",
        route: ROUTES.LIBRARY.PLAYLISTS,
        icon: ListMusicIcon,
    },
    {
        id: SidebarItems.Artists,
        title: "sidebar.artists",
        route: ROUTES.LIBRARY.ARTISTS,
        icon: Mic2Icon,
    },
    {
        id: SidebarItems.Radios,
        title: "sidebar.radios",
        route: ROUTES.LIBRARY.RADIOS,
        icon: RadioIcon,
    },
];

export function useLibraryItems() {
    const items = [...libraryItems];
    const { isAppleMusic } = checkServerType();

    if (isAppleMusic) {
        items.unshift(    {
            id: SidebarItems.Pins,
            title: "sidebar.pins",
            route: ROUTES.LIBRARY.PINS,
            icon: Pin
        });
    }

    return items.filter((item) => {
        if (item.id === SidebarItems.Radios) {
            return canUseRadiosLibrary();
        }

        return true;
    });
}