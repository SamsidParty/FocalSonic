import { MiniSidebarItem } from "@/app/components/sidebar/mini-item";
import { useAppPages, useAppPodcasts, useAppStore } from "@/store/app.store";
import { clsx } from "clsx";
import React from "react";
import { libraryItems, mainMenuItems } from "./sidebar-items";

export function MiniSidebar() {
    const { showRadiosSection } = useAppPages();
    const { sidebarOpen } = useAppStore().settings;
    const { active: isPodcastEnabled } = useAppPodcasts();

    return (
        <div className={clsx(!sidebarOpen ? "" : "hidden")}>
            {menuItems.map((item) => {
                // Setting to show/hide Radios section
                if (!showRadiosSection && item.id === "radios") return null;
                if (!isPodcastEnabled && item.id === "podcasts") return null;

                return <MiniSidebarItem item={item} key={item.route} />;
            })}
        </div>
    );
}

const menuItems = [...mainMenuItems, ...libraryItems];
