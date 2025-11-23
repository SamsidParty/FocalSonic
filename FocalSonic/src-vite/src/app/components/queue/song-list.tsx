import { Button } from "@/app/components/ui/button";
import { DataTableList } from "@/app/components/ui/data-table-list";
import { Separator } from "@/app/components/ui/separator";
import { queueColumns } from "@/app/tables/queue-columns";
import {
    usePlayerActions,
    usePlayerCurrentList,
    usePlayerCurrentSongIndex,
} from "@/store/player.store";
import { ColumnFilter } from "@/types/columnFilter";
import { convertSecondsToHumanRead } from "@/utils/convertSecondsToTime";
import clsx from "clsx";
import { ListXIcon } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export function QueueSongList({ small } : { small?: boolean } ) {
    const { t } = useTranslation();
    const currentList = usePlayerCurrentList();
    const currentSongIndex = usePlayerCurrentSongIndex();
    const { clearPlayerState, setSongList } = usePlayerActions();

    const columns = useMemo(() => queueColumns(), []);
    const trackListCount = useMemo(() => currentList.length, [currentList]);

    const trackListDuration = useMemo(() => {
        let minutes = 0;
        currentList.forEach((song) => (minutes += song.duration));

        return minutes && convertSecondsToHumanRead(minutes);
    }, [currentList]);

    const columnsToShow: ColumnFilter[] = [
        "index",
        "title",
        // 'artist',
        "album",
        "duration",
        "remove",
    ];

    return (
        <div className={clsx("flex flex-1 flex-col h-full", small ? "max-w-none" : "max-w-[50vw] mx-auto")}>
            <h1 className="sr-only">{t("queue.title")}</h1>
            <div className="flex items-center justify-between h-8 mb-2">
                <div className="flex gap-2 h-6 items-center text-foreground/70">
                    <p className="ml-1 text-foreground font-bold">{t("queue.title")}</p>

                    {
                        small ? (
                            <>
                                <p>{"•"}</p>
                                <p className="text-sm">
                                    {trackListCount}
                                </p>
                            </>
                        ) : (
                            <>
                                <p>{"•"}</p>
                                <p className="text-sm">
                                    {t("playlist.songCount", { count: trackListCount })}
                                </p>
                                <p>{"•"}</p>
                                {
                                    trackListDuration && (
                                        <p className="text-sm">
                                            {t("playlist.duration", { duration: trackListDuration })}
                                        </p>
                                    )
                                }
                            </>
                        )
                    }

  
                </div>

                <div>
                    <Button
                        variant="ghost"
                        className="px-4 h-8 rounded-full py-0 flex items-center justify-center hover:bg-foreground/20"
                        onClick={clearPlayerState}
                    >
                        <ListXIcon className="mr-1 w-5 h-5" />
                        <span className="text-sm">{t("queue.clear")}</span>
                    </Button>
                </div>
            </div>
            <Separator className="bg-muted-foreground/20" />

            <div className="w-full h-full overflow-auto">
                <DataTableList
                    data={currentList}
                    columns={columns}
                    columnFilter={columnsToShow}
                    showHeader={false}
                    handlePlaySong={(row) => setSongList(currentList, row.index)}
                    scrollToIndex={true}
                    currentSongIndex={currentSongIndex}
                    allowRowSelection={false}
                    showContextMenu={false}
                    pageType={small ? "queue-small" : "queue"}
                />
            </div>
        </div>
    );
}
