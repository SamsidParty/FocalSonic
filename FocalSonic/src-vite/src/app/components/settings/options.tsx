import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/app/components/ui/sidebar";
import { useAppRuntimeState } from "@/store/app.store";
import {
    Globe,
    LinkIcon,
    Paintbrush
} from "lucide-react";
import { ComponentType } from "react";
import { useTranslation } from "react-i18next";

export type SettingsOptions =
  | "appearance"
  | "language"
  | "audio"
  | "content"
  | "integrations"

interface OptionsData {
    id: SettingsOptions
    icon: ComponentType
}

const options: OptionsData[] = [
    { id: "appearance", icon: Paintbrush },
    { id: "language", icon: Globe },
    { id: "integrations", icon: LinkIcon },
];

export function SettingsOptions() {
    const { t } = useTranslation();
    const { currentPage, setCurrentPage } = useAppRuntimeState();

    return (
        <SidebarGroup>
            <SidebarGroupContent>
                <SidebarMenu>
                    {options.map((item) => (
                        <SidebarMenuItem key={item.id}>
                            <SidebarMenuButton
                                isActive={item.id === currentPage}
                                onClick={() => setCurrentPage(item.id)}
                            >
                                <item.icon />
                                <span>{t(`settings.options.${item.id}`)}</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}
