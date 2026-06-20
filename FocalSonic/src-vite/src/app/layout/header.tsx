import { Windows } from "@/app/components/controls/windows";
import { HeaderSongInfo } from "@/app/components/header-song";
import { NavigationButtons } from "@/app/components/header/navigation-buttons";
import { UserDropdown } from "@/app/components/header/user-dropdown";
import { useMainDrawerState } from "@/store/player.store";
import { enterFullscreen, exitFullscreen, isFullscreen } from "@/utils/browser";
import { igniteViewDragRegion } from "@/utils/igniteViewDragRegion";
import { isLinux, isMac, isWindows } from "@/utils/osType";
import { checkServerType } from "@/utils/servers";
import clsx from "clsx";
import React from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Cast } from "../components/header/cast";
import { LibrarySyncIndicator } from "../components/header/library-sync-indicator";
import { LicenseDialog } from "../components/license";
import { Separator } from "../components/ui/separator";

export function Header() {

    const { setMainDrawerState } = useMainDrawerState();
    const { isAppleMusic } = checkServerType();

    useHotkeys("f11", () => {
        if (window.igniteView) {
            if (isFullscreen()) {
                exitFullscreen();
                setMainDrawerState(false);
            }
            else {
                enterFullscreen();
                setMainDrawerState(true); 
            }
        }
    });


    return (
        <header
            className={clsx(
                "w-full grid grid-cols-header app-header h-header px-1 fixed top-0 right-0 left-0 z-20 bg-bar xxs:hidden",
                (isWindows || isLinux) && "pr-0"
            )}
        >
            <div {...igniteViewDragRegion} className="flex items-center">
                {isMac && !isFullscreen() && <div className="w-[70px]" />}
                <NavigationButtons />
            </div>
            <HeaderSongInfo />
            <div {...igniteViewDragRegion} className="flex justify-end items-center gap-2">
                <LicenseDialog />
                <LibrarySyncIndicator />
                {
                    isAppleMusic && (
                        <Cast />
                    )
                }
                <UserDropdown />
                <Separator orientation="vertical" className="bg-foreground opacity-10 h-[60%]" />
                {isWindows && <Windows />}
            </div>
        </header>
    );
}
