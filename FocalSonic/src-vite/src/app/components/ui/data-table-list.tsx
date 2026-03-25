import { SongMenuOptions } from "@/app/components/song/menu-options";
import { SelectedSongsMenuOptions } from "@/app/components/song/selected-options";
import { ColumnFilter } from "@/types/columnFilter";
import { ColumnDefType } from "@/types/react-table/columnDef";
import { ISong } from "@/types/responses/song";
import { MouseButton } from "@/utils/browser";
import { computeMultiSelectedRows } from "@/utils/dataTable";
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
    ColumnFiltersState,
    Row,
    RowData,
    SortingFn,
    SortingState,
    Table,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import clsx from "clsx";
import debounce from "lodash/debounce";
import {
    MouseEvent,
    ReactNode,
    TouchEvent,
    memo,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { isMacOs } from "react-device-detect";
import { createPortal } from "react-dom";
import { useHotkeys } from "react-hotkeys-hook";
import { DataTableListHeader } from "./data-table-list-header";
import { TableListRow } from "./data-table-list-row";
import { ScrollArea, scrollAreaViewportSelector } from "./scroll-area";

const MemoTableListRow = memo(TableListRow) as typeof TableListRow;
const MemoDataTableListHeader = memo(
    DataTableListHeader,
) as typeof DataTableListHeader;

declare module "@tanstack/react-table" {
    interface TableMeta<TData extends RowData> {
        handlePlaySong: ((row: Row<TData>) => void) | undefined
        handleLeftClick: ((row: Row<TData>) => void) | undefined
    }
    interface SortingFns {
        customSortFn: SortingFn<unknown>
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
    dataType?: "song" | "artist" | "playlist" | "radio"
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
    const newColumns = columns.filter((column) => {
        return columnFilter?.includes(column.id as ColumnFilter);
    });

    const [columnSearch, setColumnSearch] = useState<ColumnFiltersState>([]);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [rowSelection, setRowSelection] = useState({});
    const [lastRowSelected, setLastRowSelected] = useState<number | null>(null);
    const [activeItemId, setActiveItemId] = useState<string | null>(null);
    const [dragOverlayWidth, setDragOverlayWidth] = useState<number | null>(null);

    const selectedRows = useMemo(
        () => Object.keys(rowSelection).map(Number),
        [rowSelection],
    );
    const isRowSelected = useCallback(
        (rowIndex: number) => selectedRows.includes(rowIndex),
        [selectedRows],
    );

    const tableConfig = useMemo(
        () => ({
            data,
            columns: columnFilter ? newColumns : columns,
            getCoreRowModel: getCoreRowModel(),
            onColumnFiltersChange: setColumnSearch,
            onSortingChange: setSorting,
            getSortedRowModel: getSortedRowModel(),
            onRowSelectionChange: setRowSelection,
            enableSorting: false,
            sortingFns: {
                customSortFn: <T extends { original: Record<string, string> }>(
                    rowA: T,
                    rowB: T,
                    columnId: string,
                ) => {
                    return rowA.original[columnId].localeCompare(rowB.original[columnId]);
                },
            },
            meta: {
                handlePlaySong,
                handleLeftClick,
            },
            state: {
                columnFilters: columnSearch,
                sorting,
                rowSelection,
            },
        }),
        [
            data,
            columns,
            newColumns,
            columnFilter,
            handlePlaySong,
            handleLeftClick,
            columnSearch,
            sorting,
            rowSelection,
        ],
    );

    const table = useReactTable(tableConfig);

    const { rows } = table.getRowModel();
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

    const selectAllShortcut = useCallback(
        (state = true) => {
            if (allowRowSelection) {
                table.toggleAllRowsSelected(state);
            }
        },
        [allowRowSelection, table],
    );

    useHotkeys("mod+a", () => selectAllShortcut(), {
        preventDefault: true,
        enabled: !table.getIsAllRowsSelected(),
    });

    useHotkeys("esc", () => selectAllShortcut(false), {
        preventDefault: true,
        enabled: table.getIsAllRowsSelected() || table.getIsSomeRowsSelected(),
    });

    const getContextMenuOptions = useCallback(
        (row: Row<TData>) => {
            if (!showContextMenu) return undefined;

            if (dataType === "song") {
                if (table.getIsSomeRowsSelected() || table.getIsAllRowsSelected()) {
                    return (
                        <SelectedSongsMenuOptions
                            table={table as unknown as Table<ISong>}
                        />
                    );
                } else {
                    return (
                        <SongMenuOptions
                            variant="context"
                            index={row.index}
                            song={row.original as ISong}
                            context={pageType === "queue" || pageType === "queue-small" ? { source: "queue" } : undefined}
                        />
                    );
                }
            }

            return undefined;
        },
        [dataType, showContextMenu, table],
    );

    const _handleLeftClick = useCallback(
        (e: MouseEvent<HTMLDivElement>, row: Row<TData>) => {
            if (!allowRowSelection) { handleLeftClick?.(row); return; };

            // Check the correct key depending on the OS (Meta for macOS, Ctrl for others)
            const isMultiSelectKey = isMacOs ? e.metaKey : e.ctrlKey;

            if (isMultiSelectKey) {
                row.toggleSelected();
                setLastRowSelected(row.index);
                return;
            }

            if (e.shiftKey && lastRowSelected !== null) {
                const selectedRowsUpdater = computeMultiSelectedRows(
                    lastRowSelected,
                    row.index,
                );
                table.setRowSelection(selectedRowsUpdater);
                return;
            }

            handleLeftClick?.(row);

            // Deselect all rows, except current one
            table.setRowSelection({
                [row.index]: true,
            });
            setLastRowSelected(row.index);
        },
        [allowRowSelection, lastRowSelected, table],
    );

    const handleRightClick = useCallback(
        (row: Row<TData>) => {
            if (!allowRowSelection) return;

            const hasSelectedRows = selectedRows.length > 0;
            const isSelected = isRowSelected(row.index);

            if (hasSelectedRows && !isSelected) {
                table.resetRowSelection();
            }

            row.toggleSelected(true);
            setLastRowSelected(row.index);
        },
        [allowRowSelection, isRowSelected, selectedRows.length, table],
    );

    const handleClicks = useCallback(
        (e: MouseEvent<HTMLDivElement>, row: Row<TData>) => {
            if (e.nativeEvent.button === MouseButton.Left) {
                _handleLeftClick(e, row);
            }
            if (e.nativeEvent.button === MouseButton.Right) {
                handleRightClick(row);
            }
        },
        [_handleLeftClick, handleRightClick],
    );

    const handleRowDbClick = useCallback(
        (e: MouseEvent<HTMLDivElement>, row: Row<TData>) => {
            if (!handlePlaySong) return;
            e.stopPropagation();
            handlePlaySong(row);
        },
        [handlePlaySong],
    );

    const handleRowTap = useCallback(
        (e: TouchEvent<HTMLDivElement>, row: Row<TData>) => {
            if (!handlePlaySong) return;
            e.stopPropagation();
            handlePlaySong(row);
        },
        [handlePlaySong],
    );

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
        };
    }, [virtualizer.scrollElement, debouncedHandleScroll]);

    useEffect(() => {
        if (!scrollToIndex || !currentSongIndex) return;

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
                <MemoTableListRow
                    key={row.id}
                    row={row}
                    virtualRow={virtualRow}
                    handleClicks={handleClicks}
                    handleRowDbClick={handleRowDbClick}
                    handleRowTap={handleRowTap}
                    getContextMenuOptions={getContextMenuOptions}
                    dataType={dataType}
                    pageType={pageType}
                    allowRowReorder={allowRowReorder}
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
                className={clsx("relative w-full h-full overflow-hidden cursor-default caption-bottom text-sm bg-transparent")}
                data-testid="data-table"
                role="table"
            >
                <div className={clsx(!showHeader && "hidden")}>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <div
                            key={headerGroup.id}
                            className="w-full flex flex-row border-b pr-[10px] bg-muted"
                            role="row"
                        >
                            {headerGroup.headers.map((header) => (
                                <MemoDataTableListHeader key={header.id} header={header} />
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
