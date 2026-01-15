import { getCoverArtUrl } from "@/api/httpClient";
import { PlaylistOptions } from "@/app/components/playlist/options";
import { PodcastSidebarItem } from "@/app/components/podcasts/sidebar-item";
import { ContextMenuProvider } from "@/app/components/table/context-menu";
import { Button } from "@/app/components/ui/button";
import { SidebarItems } from "@/app/layout/sidebar-items";
import { ROUTES } from "@/routes/routesList";
import { useAppStore } from "@/store/app.store";
import { Playlist } from "@/types/responses/playlist";
import { GridViewWrapperType, resetGridClickedItem } from "@/utils/gridTools";
import clsx from "clsx";
import { FolderIcon, ListMusicIcon, PinIcon, Star } from "lucide-react";
import React, { ElementType, Fragment, memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";

const ListMusic = memo(ListMusicIcon);
const MemoPodcastSidebarItem = memo(PodcastSidebarItem);
const MemoContextMenuProvider = memo(ContextMenuProvider);
const MemoPlaylistOptions = memo(PlaylistOptions);

export interface ISidebarItem {
    id: string
    title: string
    route: string
    icon: ElementType
}

export function SidebarGenerator({ list }: { list: ISidebarItem[] }) {
    const location = useLocation();
    const { t } = useTranslation();
    const showRadiosSection = useAppStore().pages.showRadiosSection;
    const isPodcastsActive = useAppStore().podcasts.active;

    const isActive = useCallback(
        (route: string) => {
            return location.pathname === route;
        },
        [location.pathname],
    );

    return (
        <>
            {list.map((item) => {
                // Setting to show/hide Radios/Podcasts section
                if (!showRadiosSection && item.id === SidebarItems.Radios) return null;
                if (!isPodcastsActive && item.id === SidebarItems.Podcasts) return null;

                if (isPodcastsActive && item.id === SidebarItems.Podcasts) {
                    return <MemoPodcastSidebarItem key={item.id} item={item} />;
                }

                return (
                    <Link
                        to={item.route}
                        key={item.id}
                        tabIndex={-1}
                        className={clsx(
                            "block",
                            isActive(item.route) && "pointer-events-none",
                        )}
                        onClick={() => {
                            resetGridClickedItem({ name: item.id as GridViewWrapperType });
                        }}
                    >
                        <Button
                            variant={isActive(item.route) ? "secondary" : "ghost"}
                            size="sm"
                            className="w-full justify-start"
                        >
                            <item.icon color="var(--primary)" className="w-4 h-4 mr-2" />
                            {t(item.title)}
                        </Button>
                    </Link>
                );
            })}
        </>
    );
}

export function SidebarPlaylistGenerator({
    playlists,
    pinnedIDs, // For Apple Music
}: {
    playlists: Playlist[]
    pinnedIDs?: string[]
}) {
    const location = useLocation();

    const isActive = useCallback(
        (id: string) => {
            return location.pathname === ROUTES.PLAYLIST.PAGE(id);
        },
        [location.pathname],
    );

    // Duplicate the playlists array to then sort it
    // Sort order:
    // - "Favorite Songs" playlist always first
    // - Then pinned playlists in the order of pinnedIDs
    // - Then the rest of the playlists alphabetically
    const sortedPlaylists = [...playlists];

    sortedPlaylists.sort((a, b) => {
        // "Favorite Songs" always first
        if (a.isFavorites) return -1;
        if (b.isFavorites) return 1;

        // Pinned playlists next
        const aPinnedIndex = pinnedIDs ? pinnedIDs.indexOf(a.id) : -1;
        const bPinnedIndex = pinnedIDs ? pinnedIDs.indexOf(b.id) : -1;

        if (aPinnedIndex !== -1 && bPinnedIndex !== -1) {
            return aPinnedIndex - bPinnedIndex; // Both pinned, sort by their order in pinnedIDs
        } else if (aPinnedIndex !== -1) {
            return -1; // Only a is pinned
        } else if (bPinnedIndex !== -1) {
            return 1; // Only b is pinned
        }

        // Finally, sort alphabetically
        return a.name.localeCompare(b.name);
    });

    const getPlaylistIcon = (playlist: Playlist) => {

        if (playlist.isFavorites) {
            return (<Star color="var(--primary)" className="mr-3 min-h-4 min-w-4 h-4 w-4" />);
        }

        if (playlist.appleMusic?.type?.includes("playlist-folders")) {
            return (<FolderIcon color="var(--primary)" className="mr-3 min-h-4 min-w-4 h-4 w-4" />);
        }

        if (playlist.coverArt) {
            return (
                <img
                    src={getCoverArtUrl(playlist.coverArt)}
                    alt={playlist.name}
                    className="mr-2 -ml-1 min-h-6 min-w-6 h-6 w-6 object-cover rounded-sm"
                />
            );
        }

        return (<ListMusic color="var(--primary)" className="mr-3 min-h-4 min-w-4 h-4 w-4" />);
    };

    return (
        <Fragment>
            {sortedPlaylists.map((playlist) => (
                <Fragment key={playlist.id}>
                    <Link
                        to={ROUTES.PLAYLIST.PAGE(playlist.id)}
                        className="block"
                        tabIndex={-1}
                        onClick={(e) => {
                            if (isActive(playlist.id)) {
                                e.preventDefault();
                            }
                        }}
                    >
                        <MemoContextMenuProvider
                            options={
                                <MemoPlaylistOptions
                                    variant="context"
                                    playlist={playlist}
                                    showPlay={true}
                                />
                            }
                        >
                            <Button
                                variant={isActive(playlist.id) ? "secondary" : "ghost"}
                                size="sm"
                                className={clsx(
                                    "w-full justify-start",
                                    isActive(playlist.id) && "cursor-default hover:bg-accent",
                                )}
                            >
                                {
                                    getPlaylistIcon(playlist)
                                }
                                
                                <span className="w-full truncate text-left">
                                    {playlist.name}
                                </span>

                                {
                                    pinnedIDs?.includes(playlist.id) && (
                                        <PinIcon
                                            color="var(--foreground)"
                                            className="opacity-40 ml-auto min-h-4 min-w-4 h-4 w-4"
                                        />
                                    )
                                }
                            </Button>
                        </MemoContextMenuProvider>
                    </Link>
                </Fragment>
            ))}
        </Fragment>
    );
}
