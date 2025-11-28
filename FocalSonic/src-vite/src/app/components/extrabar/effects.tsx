import { t } from "i18next";
import React from "react";

export default function ExtrabarEffects() {
    return (
        <div className="flex items-center justify-between h-8 mb-2">
            <p className="ml-1 text-foreground font-bold">{t("player.effects.title")}</p>
        </div>
    );
}