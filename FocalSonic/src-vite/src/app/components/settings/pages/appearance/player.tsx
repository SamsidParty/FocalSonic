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
import React from "react";
import { useTranslation } from "react-i18next";

export function PlayerSettings() {
    const { t } = useTranslation();
    const { setIsPlayerAtTop, setPlayerStyle, isPlayerAtTop, playerStyle, enableLyricGlow, setEnableLyricGlow, enableLyricBlur, setEnableLyricBlur } = useTheme();

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
                <ContentItem>
                    <ContentItemTitle>
                        {t("settings.appearance.lyrics.lyricGlow")}
                    </ContentItemTitle>
                    <ContentItemForm>
                        <Switch
                            checked={enableLyricGlow}
                            onCheckedChange={setEnableLyricGlow}
                        />
                    </ContentItemForm>
                </ContentItem>
                <ContentItem>
                    <ContentItemTitle>
                        {t("settings.appearance.lyrics.lyricBlur")}
                    </ContentItemTitle>
                    <ContentItemForm>
                        <Switch
                            checked={enableLyricBlur}
                            onCheckedChange={setEnableLyricBlur}
                        />
                    </ContentItemForm>
                </ContentItem>
            </Content>
            <ContentSeparator />
        </Root>
    );
}
