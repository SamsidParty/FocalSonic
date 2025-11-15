import {
    Content,
    ContentItem,
    ContentItemForm,
    ContentItemTitle,
    ContentSeparator,
    Root
} from "@/app/components/settings/section";
import { Switch } from "@/app/components/ui/switch";
import { usePlayerStyle, useTheme } from "@/store/theme.store";
import React from "react";
import { useTranslation } from "react-i18next";

export function PlayerSettings() {
    const { t } = useTranslation();
    const { isPlayerAtTop, setIsPlayerAtTop, setPlayerStyle } = useTheme();
    const playerStyle = usePlayerStyle();

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
                <ContentItem>
                    <ContentItemTitle>
                        {t("settings.appearance.player.slimPlayer")}
                    </ContentItemTitle>
                    <ContentItemForm>
                        <Switch
                            checked={playerStyle === "slim"}
                            onCheckedChange={(v) => setPlayerStyle(v ? "slim" : "default")}
                        />
                    </ContentItemForm>
                </ContentItem>
            </Content>
            <ContentSeparator />
        </Root>
    );
}
