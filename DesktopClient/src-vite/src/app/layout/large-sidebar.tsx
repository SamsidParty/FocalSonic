import clsx from "clsx";
import { t } from "i18next";
import { memo } from "react";
import CommandMenu from "../components/command/command-menu";
import { SectionTitle, SidebarPlaylists, SidebarSection } from "../components/playlist/sidebar-list";
import { SidebarGenerator } from "../components/sidebar/sidebar-generator";
import { libraryItems, mainMenuItems, SidebarProps } from "./sidebar-items";


const MemoSidebarGenerator = memo(SidebarGenerator);
const MemoCommandMenu = memo(CommandMenu);
    

export default function LargeSidebar(props: SidebarProps) {
    return (
        <div className={clsx("min-w-sidebar max-w-sidebar overflow-clip", props.sidebarOpen ? "" : "hidden")}>
            <div className="p-4 pt-0">
                <MemoCommandMenu />
            </div>
            <div className="space-y-4 py-4 pt-0">
                <SidebarSection>
                    <div>
                        <MemoSidebarGenerator list={mainMenuItems} />
                    </div>
                </SidebarSection>
                <SidebarSection>
                    <SectionTitle>{t("sidebar.library")}</SectionTitle>
                    <div>
                        <MemoSidebarGenerator list={libraryItems} />
                    </div>
                </SidebarSection>
            </div>

            <SidebarPlaylists />
        </div>
    )
}