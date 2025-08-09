import { CommandGroup, CommandItem } from "@/app/components/ui/command";
import { libraryItems, mainMenuItems, SidebarItems } from "@/app/layout/sidebar-items";
import { useAppStore } from "@/store/app.store";
import { GridViewWrapperType, resetGridClickedItem } from "@/utils/gridTools";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { CommandItemProps } from "./command-menu";

export function CommandGotoPage({ runCommand }: CommandItemProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const hideRadiosSection = useAppStore().pages.hideRadiosSection;
    const isPodcastsActive = useAppStore().podcasts.active;

    const pages = [...mainMenuItems, ...libraryItems];

    return (
        <CommandGroup heading={t("command.pages")}>
            {pages.map(({ id, route, title }) => {
                if (hideRadiosSection && id === SidebarItems.Radios) return null;
                if (!isPodcastsActive && id === SidebarItems.Podcasts) return null;

                return (
                    <CommandItem
                        key={route}
                        onSelect={() => {
                            resetGridClickedItem({ name: id as GridViewWrapperType });
                            runCommand(() => navigate(route));
                        }}
                    >
                        {t(title)}
                    </CommandItem>
                );
            })}
        </CommandGroup>
    );
}
