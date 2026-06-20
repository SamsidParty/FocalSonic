import { SimpleTooltip } from "@/app/components/ui/simple-tooltip";
import { useSyncProgress, useSyncStatus } from "@/store/sync.store";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * Small spinner shown next to the AirPlay button while the library is syncing.
 * Hidden when idle so it doesn't add chrome the rest of the time.
 */
export function LibrarySyncIndicator() {
    const status = useSyncStatus();
    const { synced, total } = useSyncProgress();
    const { t } = useTranslation();

    if (status !== "syncing") return null;

    const tooltip = total > 0
        ? t("sync.progress", { synced, total })
        : t("sync.inProgress");

    return (
        <SimpleTooltip text={tooltip}>
            <div className="flex items-center justify-center w-8 h-8" aria-label={tooltip}>
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
        </SimpleTooltip>
    );
}
