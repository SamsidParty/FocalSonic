import {
    Content,
    ContentItem,
    ContentItemForm,
    ContentItemTitle,
    ContentSeparator,
    Root
} from "@/app/components/settings/section";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Switch } from "@/app/components/ui/switch";
import { useTheme } from "@/store/theme.store";
import React from "react";
import { useTranslation } from "react-i18next";

export function PlayerSettings() {
    const { t } = useTranslation();
    const { setIsPlayerAtTop, setPlayerStyle, isPlayerAtTop, playerStyle, enableLyricGlow, setEnableLyricGlow, enableLyricBlur, setEnableLyricBlur } = useTheme();

    const availablePlayerStyles = ["default", "slim", "floating"];

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
                        {t("settings.appearance.player.variant")}
                    </ContentItemTitle>
                    <ContentItemForm>
                        <Select value={playerStyle} onValueChange={setPlayerStyle}>
                            <SelectTrigger className="h-8 ring-offset-transparent focus:ring-0 focus:ring-transparent text-left">
                                <SelectValue>
                                    <span className="text-sm text-foreground">
                                        {playerStyle.charAt(0).toUpperCase() + playerStyle.slice(1)}
                                    </span>
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent align="end">
                                <SelectGroup>
                                    {availablePlayerStyles.map((style, i) => (
                                        <SelectItem
                                            key={i}
                                            value={style}
                                        >
                                            <span className="text-sm text-foreground">
                                                {style.charAt(0).toUpperCase() + style.slice(1)}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </ContentItemForm>
                </ContentItem>
            </Content>
            <ContentSeparator />
            <Content className="mt-4">
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
