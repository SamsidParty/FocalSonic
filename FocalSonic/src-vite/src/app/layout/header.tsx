import { Windows } from "@/app/components/controls/windows";
import { HeaderSongInfo } from "@/app/components/header-song";
import { NavigationButtons } from "@/app/components/header/navigation-buttons";
import { UserDropdown } from "@/app/components/header/user-dropdown";
import { useWindowMode } from "@/store/window.store";
import { igniteViewDragRegion } from "@/utils/igniteViewDragRegion";
import { isMac, isWindows } from "@/utils/osType";
import { checkServerType } from "@/utils/servers";
import clsx from "clsx";
import { Cast } from "../components/header/cast";
import { LibrarySyncIndicator } from "../components/header/library-sync-indicator";
import { LicenseDialog } from "../components/license";
import { Separator } from "../components/ui/separator";

export function Header() {
    const { isAppleMusic } = checkServerType();
    const { isFullscreen } = useWindowMode();

    return (
        <header
            className={clsx(
                "w-full grid grid-cols-header app-header h-header px-1 fixed top-0 right-0 left-0 z-20 bg-bar xxs:hidden pr-0",
            )}
        >
            <div {...igniteViewDragRegion} className="flex items-center">
                {isMac && !isFullscreen && <div className="w-[70px]" />}
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
