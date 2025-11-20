import { Button } from "@/app/components/ui/button";
import { SimpleTooltip } from "@/app/components/ui/simple-tooltip";
import { usePlaylists } from "@/store/playlists.store";
import { PlusIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

export function SidebarPlaylistButtons() {
    const { setPlaylistDialogState } = usePlaylists();
    const { t } = useTranslation();

    return (
        <div className="flex items-center gap-2">
            <SimpleTooltip text={t("playlist.form.create.title")}>
                <Button
                    size="icon"
                    variant="ghost"
                    className="w-6 h-6 p-1 opacity-70"
                    onClick={() => setPlaylistDialogState(true)}
                >
                    <PlusIcon strokeWidth={2} />
                </Button>
            </SimpleTooltip>
        </div>
    );
}
