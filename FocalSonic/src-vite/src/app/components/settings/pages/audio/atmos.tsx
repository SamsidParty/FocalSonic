import { DolbyIconLarge } from "@/app/components/icons/dolby";
import {
    Content,
    ContentItem,
    ContentItemForm,
    ContentItemTitle,
    ContentSeparator,
    Header,
    HeaderDescription,
    HeaderTitle,
    Root
} from "@/app/components/settings/section";
import { Switch } from "@/app/components/ui/switch";
import { useSharedSettings } from "@/store/shared.store";
import { checkServerType } from "@/utils/servers";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

export function isAtmosSupported() {
    // Check for ec-3 codec support
    const audio = document.createElement("audio");
    const isEc3Supported = audio.canPlayType('audio/mp4; codecs="ec-3"') !== "";
    return isEc3Supported;
}

export function AtmosSettings() {
    const { t } = useTranslation();
    const { enableAtmos, setEnableAtmos: _setEnableAtmos } = useSharedSettings();
    const { isAppleMusic } = checkServerType();
    const [hasChanged, setHasChanged] = useState(false);

    if (!isAppleMusic) return;

    function setEnableAtmos(value: boolean) {
        setHasChanged(true);
        _setEnableAtmos(value);
    }

    return (
        <Root>
            <Header>
                <HeaderTitle><DolbyIconLarge/></HeaderTitle>
                <HeaderDescription>
                    {t("settings.audio.atmos.description")}
                </HeaderDescription>
                {
                    !isAtmosSupported() && (
                        <HeaderDescription className="text-[crimson]">
                            {t("settings.audio.atmos.unsupported")}
                        </HeaderDescription>
                    )
                }
                {
                    hasChanged && (
                        <HeaderDescription className="opacity-60">
                            {t("settings.audio.atmos.changes")}
                        </HeaderDescription>
                    )
                }
            </Header>
            <Content>
                <ContentItem>
                    <ContentItemTitle>
                        {t("settings.audio.atmos.toggle")}
                    </ContentItemTitle>
                    <ContentItemForm>
                        <Switch
                            checked={enableAtmos}
                            onCheckedChange={setEnableAtmos}
                        />
                    </ContentItemForm>
                </ContentItem>

            </Content>
            <ContentSeparator />
        </Root>
    );
}
