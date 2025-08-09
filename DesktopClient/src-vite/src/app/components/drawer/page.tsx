import { LyricsTab } from "@/app/components/fullscreen/lyrics";
import { QueueSettings } from "@/app/components/fullscreen/settings";
import { CurrentSongInfo } from "@/app/components/queue/current-song-info";
import { QueueSongList } from "@/app/components/queue/song-list";
import { Button } from "@/app/components/ui/button";
import { Drawer, DrawerContent } from "@/app/components/ui/drawer";
import { cn } from "@/lib/utils";
import {
    useLyricsState,
    useMainDrawerState,
    useQueueState
} from "@/store/player.store";
import clsx from "clsx";
import { ChevronDownIcon } from "lucide-react";
import { ComponentPropsWithoutRef } from "react";
import { useFullscreenBackdrop } from "../fullscreen/backdrop";

export function MainDrawerPage() {
    const { mainDrawerState, closeDrawer } = useMainDrawerState();
    const { queueState } = useQueueState();
    const { lyricsState } = useLyricsState();
    const FullscreenBackdrop = useFullscreenBackdrop();

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
                className="main-drawer rounded-t-none border-none select-none cursor-default outline-none"
                showHandle={false}
                aria-describedby={undefined}
            >
                {FullscreenBackdrop}
                <div
                    className={clsx(
                        "flex flex-col w-full h-content",
                        "transition-[background-image,background-color] duration-1000",
                        "default-gradient",
                    )}
                >
                    <div className="absolute flex w-full h-14 min-h-14 px-[6%] items-center justify-end gap-2">
                        <QueueSettings />
                        <Button
                            variant="ghost"
                            className="w-10 h-10 rounded-full p-0 hover:bg-foreground/20"
                            onClick={closeDrawer}
                        >
                            <ChevronDownIcon />
                        </Button>
                    </div>
                    <div className="flex items-center w-full h-full mt-12 px-[6%] mb-0">
                        <CurrentSongInfo />

                        <div className="flex self-stretch flex-1 justify-center relative">
                            <ActiveContent active={queueState}>
                                <QueueSongList />
                            </ActiveContent>
                            <ActiveContent active={lyricsState}>
                                <LyricsTab leftAlign />
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
                "w-full h-full absolute inset-0 opacity-0 pointer-events-none transition-opacity duration-300 bg-black/0",
                active && "opacity-100 pointer-events-auto",
                className,
            )}
            {...props}
        >
            {children}
        </div>
    );
}
