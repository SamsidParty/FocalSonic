import { useAppSettings } from "@/store/app.store";
import clsx from "clsx";
import { t } from "i18next";
import React, { memo } from "react";
import CommandMenu from "../components/command/command-menu";
import { SectionTitle, SidebarPlaylists, SidebarSection } from "../components/playlist/sidebar-list";
import { SidebarGenerator } from "../components/sidebar/sidebar-generator";
import { mainMenuItems, useLibraryItems } from "./sidebar-items";


const MemoSidebarGenerator = memo(SidebarGenerator);
const MemoCommandMenu = memo(CommandMenu);
    

export default function LargeSidebar() {
    const { sidebarOpen } = useAppSettings();
    
    return (
        <div className={clsx("min-w-sidebar max-w-sidebar overflow-clip", sidebarOpen ? "" : "hidden")}>
            <div className="p-4 pt-0">
                <MemoCommandMenu />
            </div>
            <div className="space-y-4 pb-4 pt-0">
                <SidebarSection>
                    <div>
                        <MemoSidebarGenerator list={mainMenuItems.slice(1)} />
                    </div>
                </SidebarSection>
                <SidebarSection>
                    <SectionTitle>{t("sidebar.library")}</SectionTitle>
                    <div>
                        <MemoSidebarGenerator list={useLibraryItems()} />
                    </div>
                </SidebarSection>
            </div>

            <SidebarPlaylists />
        </div>
    );
}