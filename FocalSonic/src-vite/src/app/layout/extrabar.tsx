import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app.store";
import { usePlayerStyle } from "@/store/theme.store";
import React from "react";

export function Extrabar() {
    const { t } = useTranslation();
    const appStore = useAppStore();
    const { isPlayerAtTop } = usePlayerStyle();

    return (
        <aside>
            <div
                className={cn(
                    "flex-col fixed bg-bar right-0 bottom-0 z-10",
                    "transition-[width] duration-500 ease-long",
                    "overflow-x-clip overflow-y-auto no-scrollbar",
                    (appStore.settings.extraBarContent === "none") ? "w-0  pr-0" : "w-sidebar pr-3",
                    isPlayerAtTop ? "top-[calc(var(--player-height)+var(--header-height))]" : "top-header bottom-player"
                )}
            >
                {
                    (appStore.settings.extraBarContent !== "none") && (
                        <div className="bg-body rounded-md w-full h-full flex flex-col">

                        </div>
                    )
                }

            </div>
        </aside>
    );
}

