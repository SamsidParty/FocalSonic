import { t } from "i18next";
import React from "react";
import Equalizer from "../player/equalizer";

export default function ExtrabarEffects() {
    return (
        <div className="flex flex-col h-8 mb-2">
            <p className="ml-1 text-foreground font-bold">{t("player.effects.title")}</p>
            <Equalizer />
        </div>
    );
}