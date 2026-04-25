import { ColumnFilter } from "@/types/columnFilter";
import { ColumnDefType } from "@/types/react-table/columnDef";
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
    Row,
    RowData,
    RowSelectionState,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import clsx from "clsx";
import debounce from "lodash/debounce";
import {
    ReactNode,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { createPortal } from "react-dom";
import { getDataTableContextMenuOptions } from "./data-table-context-menu";
import { DataTableListHeader } from "./data-table-list-header";
import { TableListRow } from "./data-table-list-row";
import { ScrollArea, scrollAreaViewportSelector } from "./scroll-area";
import { useDataTableRowInteractions } from "./use-data-table-row-interactions";
import { useDataTableTypeAhead } from "./use-data-table-typeahead";

declare module "@tanstack/react-table" {
    interface TableMeta<TData extends RowData> {
        handlePlaySong?: (row: Row<TData>) => void
        handleLeftClick?: (row: Row<TData>) => void
    }
}

interface DataTableProps<TData, TValue> {
    columns: ColumnDefType<TData, TValue>[]
    data: TData[]
    handlePlaySong?: (row: Row<TData>) => void
    handleLeftClick?: (row: Row<TData>) => void
    columnFilter?: ColumnFilter[]
    noRowsMessage?: string
    showHeader?: boolean
    allowRowSelection?: boolean
    showContextMenu?: boolean
    dataType?: "song" | "artist" | "playlist" | "radio" | "album"
    pageType?: "general" | "queue" | "queue-small"
    fetchNextPage?: () => void
    hasNextPage?: boolean
    scrollToIndex?: boolean
    currentSongIndex?: number
    allowRowReorder?: boolean
    onMoveRow?: (fromIndex: number, toIndex: number) => void
    renderDragOverlay?: (row: Row<TData>, meta: { width?: number }) => ReactNode
}

export function DataTableList<TData, TValue>({
    columns,
    data,
    handlePlaySong,
    handleLeftClick,
    columnFilter,
    noRowsMessage = "No results.",
    showHeader = true,
    allowRowSelection = true,
    showContextMenu = true,
    dataType = "song",
    pageType = "general",
    fetchNextPage,
    hasNextPage,
    scrollToIndex = false,
    currentSongIndex,
    allowRowReorder = false,
    onMoveRow,
    renderDragOverlay,
}: DataTableProps<TData, TValue>) {
    const filteredColumns = useMemo(
        () => (columnFilter
            ? columns.filter((column) => columnFilter.includes(column.id as ColumnFilter))
            : columns),
        [columnFilter, columns],
    );

    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [activeItemId, setActiveItemId] = useState<string | null>(null);
    const [dragOverlayWidth, setDragOverlayWidth] = useState<number | null>(null);

    const table = useReactTable({
        data,
        columns: filteredColumns,
        getCoreRowModel: getCoreRowModel(),
        onRowSelectionChange: setRowSelection,
        enableSorting: false,
        sortingFns: {
            customSortFn: (rowA, rowB, columnId) => {
                const left = String((rowA.original as Record<string, unknown>)[columnId] ?? "");
                const right = String((rowB.original as Record<string, unknown>)[columnId] ?? "");

                return left.localeCompare(right);
            },
        },
        meta: {
            handlePlaySong,
            handleLeftClick,
        },
        state: {
            rowSelection,
        },
    });

    const { rows } = table.getRowModel();

    const {
        handleClicks,
        handleRowDoubleClick,
        handleTouchCancel,
        handleTouchEnd,
        handleTouchMove,
        handleTouchStart,
    } = useDataTableRowInteractions({
        allowRowSelection,
        handleActivateRow: handlePlaySong,
        handlePrimaryAction: handleLeftClick,
        rowSelection,
        setRowSelection,
        table,
    });

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
    );
    const sortableItemIds = useMemo(
        () => rows.map((row) => ((row.original as { id?: string }).id ?? row.id)),
        [rows],
    );

    const parentRef = useRef<HTMLDivElement>(null);

    const getScrollElement = () => {
        if (!parentRef.current) return null;

        return parentRef.current.querySelector(scrollAreaViewportSelector);
    };

    const estimateSize = useCallback(() => 56, []);

    const virtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement,
        estimateSize,
        overscan: 5,
    });

    const handleTypeAheadMatch = useCallback(
        (row: Row<TData>) => {
            virtualizer.scrollToIndex(row.index, {
                align: "center",
            });
        },
        [virtualizer],
    );

    const {
        handleTypeAheadKeyDown,
        handleTypeAheadMouseEnter,
        handleTypeAheadMouseDown,
        typeAheadRowId,
    } = useDataTableTypeAhead({
        allowRowSelection,
        enabled: dataType === "song",
        getItemText: (row) => String((row.original as { title?: unknown }).title ?? ""),
        onMatch: handleTypeAheadMatch,
        rows,
        setRowSelection,
    });

    const handleScroll = useCallback(() => {
        if (!virtualizer.scrollElement || !hasNextPage || !fetchNextPage) return;

        const { scrollTop, clientHeight, scrollHeight } = virtualizer.scrollElement;

        const scrollThreshold = scrollHeight - scrollHeight / 8;
        const isNearBottom = scrollTop + clientHeight >= scrollThreshold;

        if (isNearBottom) {
            fetchNextPage();
        }
    }, [fetchNextPage, hasNextPage, virtualizer.scrollElement]);

    const debouncedHandleScroll = useMemo(
        () => debounce(handleScroll, 200),
        [handleScroll],
    );

    useEffect(() => {
        if (!virtualizer.scrollElement) return;

        const scrollElement = virtualizer.scrollElement;

        scrollElement.addEventListener("scroll", debouncedHandleScroll);
        return () => {
            scrollElement.removeEventListener("scroll", debouncedHandleScroll);
            debouncedHandleScroll.cancel();
        };
    }, [virtualizer.scrollElement, debouncedHandleScroll]);

    useEffect(() => {
        if (!scrollToIndex || currentSongIndex == null) return;

        virtualizer.scrollToIndex(currentSongIndex, {
            align: "start",
        });
    }, [currentSongIndex, scrollToIndex, virtualizer]);

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            setActiveItemId(null);
            setDragOverlayWidth(null);

            if (!allowRowReorder || !onMoveRow || !event.over) {
                return;
            }

            const fromIndex = sortableItemIds.findIndex((id) => id === event.active.id);
            const toIndex = sortableItemIds.findIndex((id) => id === event.over?.id);

            if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
                return;
            }

            onMoveRow(fromIndex, toIndex);
        },
        [allowRowReorder, onMoveRow, sortableItemIds],
    );

    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveItemId(String(event.active.id));
        setDragOverlayWidth(event.active.rect.current.initial?.width ?? null);
    }, []);

    const handleDragCancel = useCallback(() => {
        setActiveItemId(null);
        setDragOverlayWidth(null);
    }, []);

    const activeRow = useMemo(
        () => rows.find((row) => (((row.original as { id?: string }).id ?? row.id) === activeItemId)),
        [activeItemId, rows],
    );

    const rowsContent = virtualizer.getVirtualItems().length ? (
        virtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index];

            return (
                <TableListRow
                    key={row.id}
                    row={row}
                    virtualRow={virtualRow}
                    handleClicks={handleClicks}
                    handleRowDbClick={handleRowDoubleClick}
                    handleTouchStart={handleTouchStart}
                    handleTouchMove={handleTouchMove}
                    handleTouchEnd={handleTouchEnd}
                    handleTouchCancel={handleTouchCancel}
                    getContextMenuOptions={(targetRow) => getDataTableContextMenuOptions({
                        dataType,
                        pageType,
                        row: targetRow,
                        showContextMenu,
                        table,
                    })}
                    dataType={dataType}
                    pageType={pageType}
                    allowRowReorder={allowRowReorder}
                    isTypeAheadMatch={row.id === typeAheadRowId}
                />
            );
        })
    ) : (
        <div role="row">
            <div
                className="flex h-24 items-center justify-center p-2"
                role="cell"
            >
                {noRowsMessage}
            </div>
        </div>
    );

    return (
        <div className="h-full">
            <div
                className={clsx("relative w-full h-full overflow-hidden cursor-default caption-bottom text-sm bg-transparent focus:outline-none")}
                data-testid="data-table"
                onKeyDown={handleTypeAheadKeyDown}
                onMouseEnter={handleTypeAheadMouseEnter}
                onMouseDown={handleTypeAheadMouseDown}
                role="table"
                tabIndex={dataType === "song" ? 0 : undefined}
            >
                <div className={clsx(!showHeader && "hidden")}>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <div
                            key={headerGroup.id}
                            className="w-full flex flex-row border-b pr-[10px] bg-muted"
                            role="row"
                        >
                            {headerGroup.headers.map((header) => (
                                <DataTableListHeader key={header.id} header={header} />
                            ))}
                        </div>
                    ))}
                </div>
                <ScrollArea
                    ref={parentRef}
                    type="always"
                    className={clsx(
                        "[&_div:last-child]:border-0 overflow-auto",
                        showHeader ? "h-[calc(100%-41px)]" : "h-full"
                    )}
                    thumbClassName={clsx(pageType === "queue" && "secondary-thumb-bar")}
                >
                    <div
                        className={clsx("w-full relative")}
                        style={{ height: `${virtualizer.getTotalSize()}px` }}
                    >
                        {allowRowReorder ? (
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
                                    {rowsContent}
                                </SortableContext>
                                {typeof document !== "undefined" && activeRow && renderDragOverlay && createPortal(
                                    <DragOverlay dropAnimation={null}>
                                        {renderDragOverlay(activeRow, { width: dragOverlayWidth ?? undefined })}
                                    </DragOverlay>,
                                    document.body,
                                )}
                            </DndContext>
                        ) : rowsContent}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}
