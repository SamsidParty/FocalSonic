import { MiniSidebarItem } from "@/app/components/sidebar/mini-item";
import { useAppStore } from "@/store/app.store";
import { clsx } from "clsx";
import React from "react";
import { mainMenuItems, useLibraryItems } from "./sidebar-items";

export function MiniSidebar() {
    const { sidebarOpen } = useAppStore().settings;

    return (
        <div className={clsx(!sidebarOpen ? "" : "hidden")}>
            {([...menuItems, ...(useLibraryItems())]).map((item) => {
                return <MiniSidebarItem item={item} key={item.route} />;
            })}
        </div>
    );
}

const menuItems = [...mainMenuItems];
