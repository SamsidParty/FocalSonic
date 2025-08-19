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
import { useAppSettings } from "@/store/app.store";
import { useTranslation } from "react-i18next";

export function Services() {
    const { t } = useTranslation();
    const { enableLRCLib, setEnableLRCLib } = useAppSettings();

    return (
        <Root>
            <Header>
                <HeaderTitle>{t("settings.integrations.services.group")}</HeaderTitle>
                <HeaderDescription>
                    {t("settings.integrations.services.description")}
                </HeaderDescription>
            </Header>
            <Content>
                <ContentItem>
                    <ContentItemTitle info={t("settings.integrations.services.lrclib.info")}>
                        {t("settings.integrations.services.lrclib.label")}
                    </ContentItemTitle>
                    <ContentItemForm>
                        <Switch
                            checked={enableLRCLib}
                            onCheckedChange={setEnableLRCLib}
                        />
                    </ContentItemForm>
                </ContentItem>
            </Content>
            <ContentSeparator />
        </Root>
    );
}
