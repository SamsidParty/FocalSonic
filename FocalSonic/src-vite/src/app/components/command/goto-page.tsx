import { CommandGroup, CommandItem } from "@/app/components/ui/command";
import { mainMenuItems, useLibraryItems } from "@/app/layout/sidebar-items";
import { GridViewWrapperType, resetGridClickedItem } from "@/utils/gridTools";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { CommandItemProps } from "./command-menu";

export function CommandGotoPage({ runCommand }: CommandItemProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const pages = [...mainMenuItems, ...useLibraryItems()];

    return (
        <CommandGroup heading={t("command.pages")}>
            {pages.map(({ id, route, title }) => {
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
