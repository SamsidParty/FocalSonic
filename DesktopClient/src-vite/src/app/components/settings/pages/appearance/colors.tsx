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
import { useDynamicColors } from "@/store/player.store";
import { useTranslation } from "react-i18next";

export function ColorSettings() {
    const { t } = useTranslation();
    const {
        useDynamicColorsOnQueue,
        setuseDynamicColorsOnQueue,
        useDynamicColorsOnBigPlayer,
        setuseDynamicColorsOnBigPlayer,
    } = useDynamicColors();

    return (
        <Root>
            <Header>
                <HeaderTitle>{t("settings.appearance.colors.group")}</HeaderTitle>
                <HeaderDescription>
                    {t("settings.appearance.colors.description")}
                </HeaderDescription>
            </Header>
            <Content>
                <ContentItem>
                    <ContentItemTitle>
                        {t("settings.appearance.colors.queue.label")}
                    </ContentItemTitle>
                    <ContentItemForm>
                        <Switch
                            checked={useDynamicColorsOnQueue}
                            onCheckedChange={setuseDynamicColorsOnQueue}
                        />
                    </ContentItemForm>
                </ContentItem>

                <ContentItem>
                    <ContentItemTitle>
                        {t("settings.appearance.colors.bigPlayer.label")}
                    </ContentItemTitle>
                    <ContentItemForm>
                        <Switch
                            checked={useDynamicColorsOnBigPlayer}
                            onCheckedChange={setuseDynamicColorsOnBigPlayer}
                        />
                    </ContentItemForm>
                </ContentItem>
            </Content>
            <ContentSeparator />
        </Root>
    );
}
