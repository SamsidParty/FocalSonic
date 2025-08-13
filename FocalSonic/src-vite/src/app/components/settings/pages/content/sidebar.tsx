import {
    Content,
    ContentItem,
    ContentItemForm,
    ContentItemTitle,
    ContentSeparator,
    Header,
    HeaderDescription,
    HeaderTitle,
    Root,
} from "@/app/components/settings/section";
import { Switch } from "@/app/components/ui/switch";
import { useAppPages } from "@/store/app.store";
import { useTranslation } from "react-i18next";

const showRadiosSectionConfig = window.SHOW_RADIOS_SECTION ?? false;

export function SidebarContent() {
    const { t } = useTranslation();
    const { showRadiosSection, setshowRadiosSection } = useAppPages();

    return (
        <Root>
            <Header>
                <HeaderTitle>{t("settings.content.sidebar.group")}</HeaderTitle>
                <HeaderDescription>
                    {t("settings.content.sidebar.description")}
                </HeaderDescription>
            </Header>
            <Content>
                <ContentItem>
                    <ContentItemTitle>
                        {t("settings.content.sidebar.radios.section")}
                    </ContentItemTitle>
                    <ContentItemForm>
                        <Switch
                            checked={!showRadiosSection}
                            onCheckedChange={setshowRadiosSection}
                            disabled={showRadiosSectionConfig}
                        />
                    </ContentItemForm>
                </ContentItem>
            </Content>
            <ContentSeparator />
        </Root>
    );
}
