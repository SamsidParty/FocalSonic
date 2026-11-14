import { LyricsTab } from "@/app/components/fullscreen/lyrics";
import { QueueSettings } from "@/app/components/fullscreen/settings";
import { CurrentSongInfo } from "@/app/components/queue/current-song-info";
import { QueueSongList } from "@/app/components/queue/song-list";
import { Button } from "@/app/components/ui/button";
import { Drawer, DrawerContent } from "@/app/components/ui/drawer";
import { cn } from "@/lib/utils";
import { useAppSettings } from "@/store/app.store";
import {
    useCustomFullscreenBackground,
    useLyricsState,
    useMainDrawerState,
    useQueueState
} from "@/store/player.store";
import { usePlayerStyle } from "@/store/theme.store";
import { useWindowLayout, useWindowMode } from "@/store/window.store";
import "@/utils/idle"; // for idle detection
import { isMac } from "@/utils/osType";
import clsx from "clsx";
import { ChevronDownIcon, Maximize2Icon } from "lucide-react";
import { ComponentPropsWithoutRef } from "react";
import { useFullscreenBackdrop } from "../fullscreen/backdrop";
import Equalizer from "../player/equalizer";

export function MainDrawerPage() {
    const { mainDrawerState, closeDrawer } = useMainDrawerState();
    const { queueState } = useQueueState();
    const { extraBarContent } = useAppSettings();
    const { lyricsState } = useLyricsState();
    const { isPlayerAtTop } = usePlayerStyle();
    const { isFullscreen, isMiniPlayer, toggleFullscreen } = useWindowMode();
    const { isCompact, isLandscape } = useWindowLayout();
    const { hideAlbumArt } = useCustomFullscreenBackground();
    const hasExtraContent = extraBarContent != "none";
    const FullscreenBackdrop = useFullscreenBackdrop({ lightenBackground: extraBarContent == "queue" || extraBarContent == "effects" });

    return (
        <Drawer
            open={mainDrawerState}
            onClose={closeDrawer}
            fixed={true}
            handleOnly={true}
            disablePreventScroll={true}
            dismissible={true}
            modal={false}
        >
            <DrawerContent
                className={clsx(
                    "main-drawer rounded-t-none border-none select-none cursor-default outline-none",
                    isPlayerAtTop ? "mt-fs-player h-content" : "h-drawer"
                )}
                showHandle={false}
                aria-describedby={undefined}
            >
                {FullscreenBackdrop}
                <div
                    className={clsx(
                        "flex flex-col w-full transition-[height,margin] ease-long duration-1000",
                        // In fullscreen, --vertical-shift is the room the player bar needs, and 0px while
                        // it's hidden for idling (index.css). The height takes it off directly: leaving
                        // flexbox to squeeze a full height box only works in Chromium, not WebKit.
                        (isFullscreen || isCompact)
                            ? "h-[calc(var(--content-height)-var(--vertical-shift,0px))]"
                            : "h-[calc(var(--drawer-height)-var(--fs-player-height))]",
                        isPlayerAtTop && "mt-vertical-shift"
                    )}
                >
                    {/* The compact layout has no header, so this bar stands in as the drag region */}
                    <div
                        className={clsx(
                            "absolute text-white hide-in-fullscreen-idle transition-opacity duration-600 ease-long flex w-full h-14 min-h-14 items-center justify-end gap-2",
                            "px-2 z-[60]",
                            isCompact && "hide-on-idle"
                        )}
                        {...(isCompact ? { "data-webview-drag": "true" } : {}) }
                    >
                        { !isCompact && <QueueSettings className={(isMac && !isFullscreen) ? "ml-14 -mt-2" : ""} /> }

                        {
                            !isCompact && (
                                <Button
                                    variant="ghost"
                                    data-webview-ignore={""}
                                    className="w-10 h-10 rounded-full p-0 hover:bg-foreground/20"
                                    onClick={toggleFullscreen}
                                >
                                    {
                                        <Maximize2Icon />
                                    }
                            
                                </Button>
                            )
                        }


                        <Button
                            variant="ghost"
                            data-webview-ignore={""}
                            className="w-10 h-10 hide-in-fullscreen rounded-full p-0 hover:bg-foreground/20"
                            onClick={closeDrawer}
                        >
                            {
                                isMiniPlayer ? <Maximize2Icon /> : <ChevronDownIcon />
                            }
                            
                        </Button>

                    </div>
                    <div className="flex items-center w-full h-full mt-12 xxs:mt-0 mb-0">
                        {!hideAlbumArt && <CurrentSongInfo fillWidth={!hasExtraContent} />}

                        <div className={clsx("flex self-stretch flex-1 justify-center relative z-40", !hasExtraContent && "hidden")}>
                            <ActiveContent active={queueState}>
                                <QueueSongList />
                            </ActiveContent>
                            {/* A compact portrait window only has room for the album art */}
                            <ActiveContent active={lyricsState && (!isCompact || isLandscape)}>
                                <LyricsTab
                                    leftAlign={!hideAlbumArt}
                                    oneLine={hideAlbumArt} 
                                    visible={mainDrawerState && lyricsState}
                                    containerClassName={
                                        hideAlbumArt ? clsx(
                                            "absolute left-0 right-0 bottom-4 lyrics-bottom",
                                        ) : ""
                                    }
                                />
                            </ActiveContent>
                            <ActiveContent active={extraBarContent === "effects"}>
                                <Equalizer small={false} orientation="horizontal" />
                            </ActiveContent>
                        </div>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
}

type ActiveContentProps = ComponentPropsWithoutRef<"div"> & {
    active: boolean
}

function ActiveContent({
    active,
    children,
    className,
    ...props
}: ActiveContentProps) {
    return (
        <div
            className={cn(
                "w-full h-full absolute inset-0 opacity-0 pointer-events-none transition-opacity duration-300",
                active && "opacity-100 pointer-events-auto",
                className,
            )}
            {...props}
        >
            {children}
        </div>
    );
}
