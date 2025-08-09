import { useTranslation } from "react-i18next";

import { CreatePlaylistDialog } from "@/app/components/playlist/form-dialog";
import { cn } from "@/lib/utils";
import { SidebarMenuButton } from "../components/sidebar/menu-button";
import LargeSidebar from "./large-sidebar";
import { MiniSidebar } from "./mini-sidebar";
import { SidebarProps } from "./sidebar-items";

export function Sidebar(props: SidebarProps) {
    const { t } = useTranslation();

    return (
        <aside>
            <div
                className={cn(
                    "flex-col border-r fixed top-header left-0 bottom-0 pb-player bg-background z-10",
                    "transition-[width] duration-500 ease-long",
                    "overflow-clip",
                    !props.sidebarOpen ? "w-mini-sidebar p-2" : "w-sidebar",
                    props.className,
                )}
            >

                <div className={cn("transition-[margin-left] duration-500 ease-long", props.sidebarOpen ? "p-2 ml-2" : "w-full")}>
                    <SidebarMenuButton setSidebarOpen={props.setSidebarOpen} sidebarOpen={props.sidebarOpen} />
                </div>
                
                <LargeSidebar {...props} />
                <MiniSidebar {...props}  />
            </div>

            <CreatePlaylistDialog />
        </aside>
    );
}

