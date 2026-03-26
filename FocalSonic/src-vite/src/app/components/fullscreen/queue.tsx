import { SongMenuOptions } from "@/app/components/song/menu-options";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import {
    usePlayerActions,
    usePlayerIsPlaying,
    usePlayerSonglist,
} from "@/store/player.store";
import {
    closestCenter,
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    AnimateLayoutChanges,
    defaultAnimateLayoutChanges,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ComponentProps, CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AppleMusicRadioCard } from "../queue/apple-music-radio-card";
import { QueueItem } from "./queue-item";

const animateLayoutChanges: AnimateLayoutChanges = (args) => {
    if (args.isSorting) {
        return defaultAnimateLayoutChanges(args);
    }

    return false;
};

export function FullscreenSongQueue() {
    const { setSongList, moveSongInQueue } = usePlayerActions();
    const { currentList, currentSongIndex, currentSong } = usePlayerSonglist();
    const isPlaying = usePlayerIsPlaying();
    const [activeSongId, setActiveSongId] = useState<string | null>(null);
    const [dragOverlayWidth, setDragOverlayWidth] = useState<number | null>(null);
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
    );

    const parentRef = useRef<HTMLDivElement>(null);

    const getScrollElement = () => {
        if (!parentRef.current) return null;

        return parentRef.current.querySelector("[data-radix-scroll-area-viewport]");
    };

    const virtualizer = useVirtualizer({
        count: currentList.length,
        getScrollElement,
        estimateSize: () => 64,
        overscan: 5,
    });
    const sortableItemIds = useMemo(
        () => currentList.map((song) => song.id),
        [currentList],
    );

    useEffect(() => {
        if (currentSongIndex >= 0) {
            virtualizer.scrollToIndex(currentSongIndex, { align: "start" });
        }
    }, [currentSongIndex, virtualizer]);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        setActiveSongId(null);
        setDragOverlayWidth(null);

        if (!event.over) {
            return;
        }

        const fromIndex = sortableItemIds.findIndex((id) => id === event.active.id);
        const toIndex = sortableItemIds.findIndex((id) => id === event.over?.id);

        if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
            return;
        }

        moveSongInQueue(fromIndex, toIndex);
    }, [moveSongInQueue, sortableItemIds]);

    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveSongId(String(event.active.id));
        setDragOverlayWidth(event.active.rect.current.initial?.width ?? null);
    }, []);

    const handleDragCancel = useCallback(() => {
        setActiveSongId(null);
        setDragOverlayWidth(null);
    }, []);

    const activeSong = useMemo(
        () => currentList.find((song) => song.id === activeSongId),
        [activeSongId, currentList],
    );

    if (currentList.length === 0)
        return (
            <div className="flex justify-center items-center">
                <span>No songs in queue</span>
            </div>
        );


    return (
        <div className="flex h-full min-h-0 flex-col gap-3">
            <AppleMusicRadioCard />
            <ScrollArea
                ref={parentRef}
                type="always"
                className="min-h-0 h-full overflow-auto"
            >
                <div
                    style={{
                        height: `${virtualizer.getTotalSize()}px`,
                        width: "100%",
                        position: "relative",
                    }}
                >
                    <DndContext
                        collisionDetection={closestCenter}
                        sensors={sensors}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onDragCancel={handleDragCancel}
                    >
                        <SortableContext
                            items={sortableItemIds}
                            strategy={verticalListSortingStrategy}
                        >
                            {virtualizer.getVirtualItems().map((virtualRow) => {
                                const entry = currentList[virtualRow.index];
                                return (
                                    <SortableQueueItem
                                        key={entry.id}
                                        index={virtualRow.index}
                                        songId={entry.id}
                                        song={entry}
                                        isPlaying={currentSong.id === entry.id && isPlaying}
                                        isActive={currentSong.id === entry.id}
                                        style={{
                                            position: "absolute",
                                            top: virtualRow.start,
                                            width: "100%",
                                        }}
                                        contextMenuOptions={(
                                            <SongMenuOptions
                                                variant="context"
                                                index={virtualRow.index}
                                                song={entry}
                                                context={{ source: "queue" }}
                                            />
                                        )}
                                        onClick={() => {
                                            if (currentSong.id !== entry.id) {
                                                setSongList(currentList, virtualRow.index);
                                            }
                                        }}
                                    />
                                );
                            })}
                        </SortableContext>
                        {typeof document !== "undefined" && activeSong && createPortal(
                            <DragOverlay dropAnimation={null}>
                                <QueueItem
                                    index={currentList.findIndex((song) => song.id === activeSong.id)}
                                    song={activeSong}
                                    isPlaying={currentSong.id === activeSong.id && isPlaying}
                                    style={{
                                        width: dragOverlayWidth ?? undefined,
                                    }}
                                />
                            </DragOverlay>,
                            document.body,
                        )}
                    </DndContext>
                </div>
            </ScrollArea>
        </div>
    );
}

function SortableQueueItem({
    songId,
    isActive,
    style,
    ...props
}: {
    songId: string
    isActive: boolean
    style: CSSProperties
} & Omit<ComponentProps<typeof QueueItem>, "data-state">) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: songId,
        animateLayoutChanges,
    });

    return (
        <QueueItem
            ref={setNodeRef}
            data-state={isActive ? "active" : "inactive"}
            data-dragging={isDragging ? "true" : undefined}
            style={{
                ...style,
                transform: CSS.Transform.toString(transform),
                transition: isDragging ? undefined : transition,
                willChange: "transform",
                zIndex: isDragging ? 10 : undefined,
            }}
            {...attributes}
            {...listeners}
            {...props}
        />
    );
}
