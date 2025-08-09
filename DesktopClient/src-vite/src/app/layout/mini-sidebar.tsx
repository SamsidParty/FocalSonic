import { MiniSidebarItem } from "@/app/components/sidebar/mini-item";
import { MiniSidebarSearch } from "@/app/components/sidebar/mini-search";
import { useAppPages, useAppPodcasts } from "@/store/app.store";
import { clsx } from "clsx";
import { libraryItems, mainMenuItems, SidebarProps } from "./sidebar-items";

export function MiniSidebar(props: SidebarProps) {
    const { hideRadiosSection } = useAppPages();
    const { active: isPodcastEnabled } = useAppPodcasts();

    return (
        <div className={clsx(!props.sidebarOpen ? "" : "hidden")}>
            <MiniSidebarSearch />

            {menuItems.map((item) => {
                // Setting to show/hide Radios section
                if (hideRadiosSection && item.id === "radios") return null;
                if (!isPodcastEnabled && item.id === "podcasts") return null;

                return <MiniSidebarItem item={item} key={item.route} />;
            })}
        </div>
    );
}

const menuItems = [...mainMenuItems, ...libraryItems];
