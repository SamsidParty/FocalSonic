import {
    Content,
    ContentItem,
    ContentItemForm,
    ContentItemTitle,
    ContentSeparator,
    Root
} from "@/app/components/settings/section";
import { Switch } from "@/app/components/ui/switch";
import { useTheme } from "@/store/theme.store";
import { useTranslation } from "react-i18next";

export function PlayerPosition() {
    const { t } = useTranslation();
    const { isPlayerAtTop, setIsPlayerAtTop } = useTheme();

    return (
        <Root>
            <Content>
                <ContentItem>
                    <ContentItemTitle>
                        {t("settings.appearance.player.showAtTop")}
                    </ContentItemTitle>
                    <ContentItemForm>
                        <Switch
                            checked={isPlayerAtTop}
                            onCheckedChange={setIsPlayerAtTop}
                        />
                    </ContentItemForm>
                </ContentItem>
            </Content>
            <ContentSeparator />
        </Root>
    );
}
