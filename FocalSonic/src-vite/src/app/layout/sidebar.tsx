import { useTranslation } from "react-i18next";

import { CreatePlaylistDialog } from "@/app/components/playlist/form-dialog";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app.store";
import { usePlayerStyle } from "@/store/theme.store";
import React from "react";
import { SidebarMenuButton } from "../components/sidebar/menu-button";
import LargeSidebar from "./large-sidebar";
import { MiniSidebar } from "./mini-sidebar";

export function Sidebar() {
    const { t } = useTranslation();
    const appStore = useAppStore();
    const { isPlayerAtTop } = usePlayerStyle();

    return (
        <aside>
            <div
                className={cn(
                    "flex-col fixed left-0 bottom-0 pb-player bg-bar z-10",
                    "transition-[width] duration-500 ease-long",
                    "overflow-x-clip overflow-y-auto no-scrollbar",
                    !appStore.settings.sidebarOpen ? "w-mini-sidebar p-2" : "w-sidebar",
                    isPlayerAtTop ? "top-[calc(var(--player-height)+var(--header-height))]" : "top-header bottom-player"
                )}
            >

                <div className={cn("transition-[margin-left] duration-500 ease-long", appStore.settings.sidebarOpen ? "p-2 ml-2" : "w-full")}>
                    <SidebarMenuButton toggleSidebar={appStore.actions.toggleSidebar} sidebarOpen={appStore.settings.sidebarOpen} />
                </div>

                <LargeSidebar />
                <MiniSidebar />
            </div>

            <CreatePlaylistDialog />
        </aside>
    );
}

