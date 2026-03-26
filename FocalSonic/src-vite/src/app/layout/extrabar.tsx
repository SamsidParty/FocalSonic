import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { useAppSettings } from "@/store/app.store";
import { usePlayerStyle } from "@/store/theme.store";
import ExtrabarEffects from "../components/extrabar/effects";
import ExtrabarLyrics from "../components/extrabar/lyrics";
import ExtrabarQueue from "../components/extrabar/queue";

export function Extrabar() {
    const { t } = useTranslation();
    const { extraBarContent } = useAppSettings();
    const { isPlayerAtTop } = usePlayerStyle();

    return (
        <aside>
            <div
                className={cn(
                    "flex-col fixed bg-bar right-0 bottom-0 z-10",
                    "transition-[width] duration-500 ease-long",
                    "overflow-x-clip overflow-y-auto no-scrollbar",
                    (extraBarContent === "none") ? "w-0  pr-0" : "w-sidebar pr-3",
                    isPlayerAtTop ? "top-[calc(var(--player-height)+var(--header-height))]" : "top-header bottom-player"
                )}
            >
                {
                    (extraBarContent !== "none") && (
                        <div className="bg-body rounded-md w-full h-full flex flex-col">
                            {extraBarContent === "lyrics" && <ExtrabarLyrics />}
                            {extraBarContent === "queue" && <ExtrabarQueue />}
                            {extraBarContent === "effects" && <ExtrabarEffects />}
                        </div>
                    )
                }

            </div>
        </aside>
    );
}

