import { LastFmIconLarge } from "@/app/components/icons/last-fm";
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
import { Button } from "@/app/components/ui/button";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function checkForLastFMSession() {
    return localStorage.getItem("lastfm_username") && localStorage.getItem("lastfm_session_key");
}

export function LastFMSettings() {
    const { t } = useTranslation();
    const [isSignedInToLastFM, setIsSignedInToLastFM] = useState(checkForLastFMSession());

    const toggleText = isSignedInToLastFM ?
        t("settings.integrations.services.lastfm.toggle_active", { username: localStorage.lastfm_username }) : 
        t("settings.integrations.services.lastfm.toggle_inactive");

    const linkOrUnlink = async () => {
        if (isSignedInToLastFM) {
            await window.igniteView?.commandBridge?.logoutOfLastFM?.();
        }
        else {
            await window.igniteView?.commandBridge?.signInToLastFM?.();
        }
    };

    // Bind window.reloadLastFMAuthState while this component is rendered
    // Clean up on unmount
    useEffect(() => {
        const reloadAuthState = () => {
            setTimeout(() => setIsSignedInToLastFM(checkForLastFMSession()), 0);
        };

        window.reloadLastFMAuthState = reloadAuthState;

        return () => {
            delete window.reloadLastFMAuthState;
        };
    }, []);


    if (!window.igniteView?.commandBridge?.signInToLastFM) return; // Don't render if not supported

    return (
        <Root>
            <Header>
                <HeaderTitle><LastFmIconLarge/></HeaderTitle>
                <HeaderDescription>
                    {t("settings.integrations.services.lastfm.info")}
                </HeaderDescription>
            </Header>
            <Content>
                <ContentItem>
                    <ContentItemTitle>
                        {toggleText}
                    </ContentItemTitle>
                    <ContentItemForm>
                        <Button onClick={linkOrUnlink} size="sm">
                            {isSignedInToLastFM ? t("settings.integrations.services.lastfm.unlink") : t("settings.integrations.services.lastfm.link")}
                        </Button>
                    </ContentItemForm>
                </ContentItem>

            </Content>
            <ContentSeparator />
        </Root>
    );
}
