import { TableSongTitle } from "@/app/components/table/song-title";
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
import { ISong } from "@/types/responses/song";
import { convertSecondsToHumanRead, convertSecondsToTime } from "@/utils/convertSecondsToTime";
import clsx from "clsx";
import { GripVertical, ListX } from "lucide-react";
import { useMemo } from "react";
import { AppleMusicRadioCard } from "./apple-music-radio-card";

import { useTranslation } from "react-i18next";

export function QueueSongList({ small } : { small?: boolean } ) {
    const { t } = useTranslation();
    const currentList = usePlayerCurrentList();
    const currentSongIndex = usePlayerCurrentSongIndex();
    const { clearPlayerState, setSongList, moveSongInQueue } = usePlayerActions();

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
        <div className={clsx("flex flex-1 flex-col h-full", small ? "max-w-none queue-small" : "max-w-[50vw] mx-auto")}>
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
                    <Button className="h-8 gap-1 p-2" size="sm" variant="secondary" onClick={clearPlayerState}>
                        <ListX size={16} />
                        {t("queue.clear")}
                    </Button>
                </div>
            </div>
            <Separator className="bg-muted-foreground/20" />

            <AppleMusicRadioCard compact={small} className="mt-3" />

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
                    showContextMenu={true}
                    pageType={small ? "queue-small" : "queue"}
                    allowRowReorder={true}
                    onMoveRow={moveSongInQueue}
                    renderDragOverlay={(row, meta) => (
                        <QueueDragOverlayRow
                            song={row.original}
                            index={row.index}
                            compact={small}
                            width={meta.width}
                        />
                    )}
                />
            </div>
        </div>
    );
}

function QueueDragOverlayRow({
    song,
    index,
    compact,
    width,
}: {
    song: ISong
    index: number
    compact?: boolean
    width?: number
}) {
    return (
        <div
            className="flex items-center rounded-md bg-background px-2 py-2 shadow-2xl"
            style={{
                width: width ?? undefined,
            }}
        >
            <div className="mr-2 flex w-8 shrink-0 items-center justify-center text-foreground/35">
                <GripVertical className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
                <TableSongTitle song={song} />
            </div>
            {!compact && (
                <div className="ml-3 w-16 shrink-0 text-right text-sm text-muted-foreground">
                    {convertSecondsToTime(song.duration ?? 0)}
                </div>
            )}
            {compact && (
                <div className="ml-3 shrink-0 text-sm text-muted-foreground">
                    {index + 1}
                </div>
            )}
        </div>
    );
}
