import { useTranslation } from "react-i18next";

import { CreatePlaylistDialog } from "@/app/components/playlist/form-dialog";
import { cn } from "@/lib/utils";
import { SidebarMenuButton } from "../components/sidebar/menu-button";
import { useAppWindow } from "../hooks/use-app-window";
import LargeSidebar from "./large-sidebar";
import { MiniSidebar } from "./mini-sidebar";

export function Sidebar() {
    const { t } = useTranslation();
    const { isSidebarOpen, toggleSidebar } = useAppWindow();

    return (
        <aside>
            <div
                className={cn(
                    "flex-col border-r fixed top-header left-0 bottom-0 pb-player bg-background z-10",
                    "transition-[width] duration-500 ease-long",
                    "overflow-x-clip overflow-y-auto no-scrollbar",
                    !isSidebarOpen ? "w-mini-sidebar p-2" : "w-sidebar",
                )}
            >

                <div className={cn("transition-[margin-left] duration-500 ease-long", isSidebarOpen ? "p-2 ml-2" : "w-full")}>
                    <SidebarMenuButton setSidebarOpen={toggleSidebar} sidebarOpen={isSidebarOpen} />
                </div>

                <LargeSidebar />
                <MiniSidebar />
            </div>

            <CreatePlaylistDialog />
        </aside>
    );
}

