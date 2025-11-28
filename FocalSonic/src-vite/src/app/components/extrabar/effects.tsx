import { t } from "i18next";
import React from "react";
import Equalizer from "../player/equalizer";

export default function ExtrabarEffects() {
    return (
        <div className="flex flex-col h-full mb-2 overflow-clip">
            <p className="ml-3 mt-3 text-foreground font-bold">{t("player.effects.title")}</p>
            <Equalizer />
        </div>
    );
}