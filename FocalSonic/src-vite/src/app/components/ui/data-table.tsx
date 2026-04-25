import {
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    Row,
    RowData,
    RowSelectionState,
    SortingFn,
    SortingState,
    useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import { Disc2Icon, XIcon } from "lucide-react";
import {
    Fragment,
    useMemo,
    useState,
} from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/app/components/ui/button";
import { DataTablePagination } from "@/app/components/ui/data-table-pagination";
import { Input } from "@/app/components/ui/input";
import { ColumnFilter } from "@/types/columnFilter";
import { ColumnDefType } from "@/types/react-table/columnDef";
import { getDataTableContextMenuOptions } from "./data-table-context-menu";
import { TableRow } from "./data-table-row";
import { useDataTableRowInteractions } from "./use-data-table-row-interactions";

declare module "@tanstack/react-table" {
    interface TableMeta<TData extends RowData> {
        handlePlaySong: ((row: Row<TData>) => void) | undefined
    }
    interface SortingFns {
        customSortFn: SortingFn<unknown>
    }
}

type DiscNumber = {
    discNumber: number
}

interface DataTableProps<TData, TValue> {
    columns: ColumnDefType<TData, TValue>[]
    data: TData[]
    handlePlaySong?: (row: Row<TData>) => void
    columnFilter?: ColumnFilter[]
    showPagination?: boolean
    showSearch?: boolean
    searchColumn?: string
    noRowsMessage?: string
    allowRowSelection?: boolean
    showContextMenu?: boolean
    showHeader?: boolean
    showDiscNumber?: boolean
    variant?: "classic" | "modern"
    dataType?: "song" | "artist" | "playlist" | "radio" | "album"
}

export function DataTable<TData, TValue>({
    columns,
    data,
    handlePlaySong,
    columnFilter,
    showPagination = false,
    showSearch = false,
    searchColumn,
    noRowsMessage = "No results.",
    allowRowSelection = true,
    showContextMenu = true,
    showHeader = true,
    showDiscNumber = false,
    variant = "classic",
    dataType = "song",
}: DataTableProps<TData, TValue>) {
    const { t } = useTranslation();
    const [columnSearch, setColumnSearch] = useState<ColumnFiltersState>([]);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

    const isClassic = variant === "classic";
    const isModern = variant === "modern";

    const filteredColumns = useMemo(
        () => (columnFilter
            ? columns.filter((column) => columnFilter.includes(column.id as ColumnFilter))
            : columns),
        [columnFilter, columns],
    );

    const table = useReactTable({
        data,
        columns: filteredColumns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: showPagination ? getPaginationRowModel() : undefined,
        onColumnFiltersChange: setColumnSearch,
        getFilteredRowModel: showSearch ? getFilteredRowModel() : undefined,
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onRowSelectionChange: setRowSelection,
        enableSorting: true,
        sortingFns: {
            customSortFn: (rowA, rowB, columnId) => {
                return rowA.original[columnId].localeCompare(rowB.original[columnId]);
            },
        },
        meta: {
            handlePlaySong,
        },
        state: {
            columnFilters: columnSearch,
            sorting,
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
        isNextRowSelected,
        isPrevRowSelected,
    } = useDataTableRowInteractions({
        allowRowSelection,
        handleActivateRow: handlePlaySong,
        rowSelection,
        setRowSelection,
        table,
    });

    const inputValue =
    searchColumn !== undefined
        ? (table.getColumn(searchColumn || "")?.getFilterValue() as string)
        : undefined;

    const discNumberIndexes = useMemo(() => {
        if (!showDiscNumber) {
            return [];
        }

        const uniqueIndices: number[] = [];
        const seen = new Set<number>();

        rows.forEach(({ original }, index) => {
            const item = original as DiscNumber;
            if (!("discNumber" in item)) return;

            if (!seen.has(item.discNumber)) {
                seen.add(item.discNumber);
                uniqueIndices.push(index);
            }
        });

        return uniqueIndices;
    }, [rows, showDiscNumber]);

    return (
        <>
            {showSearch && searchColumn && (
                <div className="flex items-center mb-4" data-testid="table-search">
                    <div className="w-72 relative">
                        <Input
                            placeholder={t("sidebar.search")}
                            value={inputValue ?? ""}
                            onChange={(event) =>
                                table
                                    .getColumn(searchColumn)
                                    ?.setFilterValue(event.target.value)
                            }
                            autoCorrect="false"
                            autoCapitalize="false"
                            spellCheck="false"
                        />
                        {inputValue !== "" && inputValue !== undefined && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                    table.getColumn(searchColumn)?.setFilterValue("")
                                }
                            >
                                <XIcon className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </div>
            )}

            <div className={clsx(isClassic && "rounded-md border")}>
                <div
                    className={clsx(
                        "relative w-full overflow-hidden rounded-md cursor-default caption-bottom text-sm",
                        isClassic ? "bg-background" : "bg-transparent",
                    )}
                    data-testid="data-table"
                    role="table"
                >
                    {showHeader && (
                        <div>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <div
                                    key={headerGroup.id}
                                    className={clsx(
                                        "w-full flex flex-row border-b border-black/10",
                                        isModern && "mb-2 border-foreground/20",
                                    )}
                                    role="row"
                                >
                                    {headerGroup.headers.map((header) => {
                                        const columnDef = header.column
                                            .columnDef as ColumnDefType<TData>;

                                        return (
                                            <div
                                                key={header.id}
                                                className={clsx(
                                                    "p-2 h-12 flex items-center justify-start align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-4",
                                                    columnDef.className,
                                                )}
                                                style={columnDef.style}
                                                role="columnheader"
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext(),
                                                    )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="[&_div:last-child]:border-0">
                        <div className="w-full h-full overflow-hidden">
                            {rows?.length ? (
                                rows.map((row, index) => (
                                    <Fragment key={row.id}>
                                        {showDiscNumber && discNumberIndexes.includes(index) && (
                                            <div
                                                className={clsx(
                                                    "w-full h-14 flex flex-row items-center transition-colors text-muted-foreground",
                                                    isClassic && "border-b",
                                                )}
                                                role="row"
                                            >
                                                <div className="w-12 flex items-center justify-center">
                                                    <Disc2Icon strokeWidth={1.75} />
                                                </div>
                                                <span className="font-medium ml-[7px]">
                                                    {t("album.table.discNumber", {
                                                        number: (row.original as DiscNumber).discNumber,
                                                    })}
                                                </span>
                                            </div>
                                        )}
                                        <TableRow
                                            index={index}
                                            row={row}
                                            contextMenuOptions={getDataTableContextMenuOptions({
                                                dataType,
                                                row,
                                                showContextMenu,
                                                table,
                                            })}
                                            isPrevRowSelected={isPrevRowSelected}
                                            isNextRowSelected={isNextRowSelected}
                                            variant={variant}
                                            dataType={dataType}
                                            onClick={(e) => handleClicks(e, row)}
                                            onDoubleClick={(e) => handleRowDoubleClick(e, row)}
                                            onTouchStart={handleTouchStart}
                                            onTouchMove={handleTouchMove}
                                            onTouchEnd={(e) => handleTouchEnd(e, row)}
                                            onTouchCancel={handleTouchCancel}
                                            onContextMenu={(e) => handleClicks(e, row)}
                                        />
                                    </Fragment>
                                ))
                            ) : (
                                <div role="row">
                                    <div
                                        className="flex h-24 items-center justify-center p-2"
                                        role="cell"
                                    >
                                        {noRowsMessage}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showPagination && <DataTablePagination table={table} />}
        </>
    );
}
