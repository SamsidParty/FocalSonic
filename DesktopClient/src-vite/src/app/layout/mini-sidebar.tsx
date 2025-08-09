import { MiniSidebarItem } from "@/app/components/sidebar/mini-item";
import { MiniSidebarSearch } from "@/app/components/sidebar/mini-search";
import { cn } from "@/lib/utils";
import { useAppPages, useAppPodcasts } from "@/store/app.store";
import { SidebarMenuButton } from "../components/sidebar/menu-button";
import { libraryItems, mainMenuItems, SidebarProps } from "./sidebar";

export function MiniSidebar({ className, sidebarOpen, setSidebarOpen }: SidebarProps) {
    const { hideRadiosSection } = useAppPages();
    const { active: isPodcastEnabled } = useAppPodcasts();

    return (
        <aside
            className={
                cn(
                    "flex-col items-center justify-start gap-1 min-w-mini-sidebar max-w-mini-sidebar",
                    "border-r fixed top-header left-0 bottom-0 pb-player bg-background z-10 p-2",
                    sidebarOpen ? "hidden" : "flex-col",
                    className
                )
            }
        >
            <SidebarMenuButton setSidebarOpen={setSidebarOpen} sidebarOpen={sidebarOpen} />
            <MiniSidebarSearch />

            {menuItems.map((item) => {
                // Setting to show/hide Radios section
                if (hideRadiosSection && item.id === "radios") return null;
                if (!isPodcastEnabled && item.id === "podcasts") return null;

                return <MiniSidebarItem item={item} key={item.route} />;
            })}
        </aside>
    );
}

const menuItems = [...mainMenuItems, ...libraryItems];
