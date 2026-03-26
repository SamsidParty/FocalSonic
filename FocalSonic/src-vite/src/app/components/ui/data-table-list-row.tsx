import { ContextMenuProvider } from "@/app/components/table/context-menu";
import { usePlayerCurrentSong } from "@/store/player.store";
import { ColumnDefType } from "@/types/react-table/columnDef";
import {
    AnimateLayoutChanges,
    defaultAnimateLayoutChanges,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Cell, flexRender, Row } from "@tanstack/react-table";
import clsx from "clsx";
import { memo, MouseEvent, TouchEvent, useMemo } from "react";

const MemoContextMenuProvider = memo(ContextMenuProvider);
const MemoTableCell = memo(TableCell) as typeof TableCell;

interface TableRowProps<TData> {
    row: Row<TData>
    virtualRow: { index: number; size: number; start: number }
    handleClicks: (e: MouseEvent<HTMLDivElement>, row: Row<TData>) => void
    handleRowDbClick: (e: MouseEvent<HTMLDivElement>, row: Row<TData>) => void
    handleRowTap: (e: TouchEvent<HTMLDivElement>, row: Row<TData>) => void
    getContextMenuOptions: (row: Row<TData>) => JSX.Element | undefined
    dataType?: "song" | "artist" | "playlist" | "radio"
    pageType?: "general" | "queue" | "queue-small"
    allowRowReorder?: boolean
}

let isTap = false;
let tapTimeout: NodeJS.Timeout;

const animateLayoutChanges: AnimateLayoutChanges = (args) => {
    if (args.isSorting) {
        return defaultAnimateLayoutChanges(args);
    }

    return false;
};

export function TableListRow<TData>({
    row,
    virtualRow,
    handleClicks,
    handleRowDbClick,
    handleRowTap,
    getContextMenuOptions,
    dataType = "song",
    pageType = "general",
    allowRowReorder = false,
}: TableRowProps<TData>) {
    const currentSong = usePlayerCurrentSong();
    const sortableId = allowRowReorder
        ? ((row.original as { id?: string }).id ?? row.id)
        : row.id;
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: sortableId,
        disabled: !allowRowReorder,
        animateLayoutChanges,
    });

    function handleTouchStart() {
        isTap = true;
        tapTimeout = setTimeout(() => {
            isTap = false;
        }, 500);
    }

    function handleTouchMove() {
        isTap = false;
    }

    function handleTouchEnd(e: TouchEvent<HTMLDivElement>) {
        clearTimeout(tapTimeout);
        if (isTap) handleRowTap(e, row);
    }

    function handleTouchCancel() {
        clearTimeout(tapTimeout);
        isTap = false;
    }

    const isRowSongActive = useMemo(() => {
        if (dataType !== "song") return false;

        // @ts-expect-error row type
        return row.original.id === currentSong.id;
    }, [currentSong.id, dataType, row.original]);

    const isQueue = pageType === "queue";

    const filterCells = (cells: Cell<TData, unknown>[]) => {
        let newCells = cells.filter((cell) => {
            
            if (pageType === "queue-small") {
                // Whitelist these columns in small queue view to save space
                return cell.column.id == "title" || cell.column.id == "index"|| cell.column.id == "index";
            }

            return true;
        });

        if (pageType === "queue-small") {
            newCells = newCells.reverse();
        }

        return newCells;
    };

    return (
        <MemoContextMenuProvider options={getContextMenuOptions(row)}>
            <div
                ref={allowRowReorder ? setNodeRef : undefined}
                role="row"
                data-test-id="table-row"
                data-row-index={virtualRow.index}
                data-state={row.getIsSelected() && "selected"}
                onClick={(e) => handleClicks(e, row)}
                onDoubleClick={(e) => handleRowDbClick(e, row)}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchCancel}
                onContextMenu={(e) => handleClicks(e, row)}
                {...(allowRowReorder ? attributes : {})}
                {...(allowRowReorder ? listeners : {})}
                className={clsx(
                    "group/tablerow w-[calc(100%-10px)] flex flex-row transition-[background-color,transform,box-shadow,opacity]",
                    "data-[state=selected]:bg-foreground/30 hover:bg-foreground/20",
                    isQueue && "rounded-md",
                    allowRowReorder && "cursor-grab active:cursor-grabbing",
                    isRowSongActive && "row-active bg-foreground/20",
                    isDragging && "opacity-0",
                )}
                style={{
                    height: `${virtualRow.size}px`,
                    position: "absolute",
                    top: virtualRow.start,
                    transform: CSS.Transform.toString(transform),
                    transition: isDragging ? undefined : transition,
                    willChange: allowRowReorder ? "transform" : undefined,
                }}
            >
                {filterCells(row.getVisibleCells()).map((cell) => (
                    <MemoTableCell key={cell.id} cell={cell} />
                ))}
            </div>
        </MemoContextMenuProvider>
    );
}

interface TableCellProps<TData, TValue> {
    cell: Cell<TData, TValue>
}

function TableCell<TData, TValue>({ cell }: TableCellProps<TData, TValue>) {
    const columnDef = cell.column.columnDef as ColumnDefType<TData>;

    return (
        <div
            key={cell.id}
            className={clsx(
                "flex flex-row items-center justify-start [&:has([role=checkbox])]:pr-4",
                columnDef.className,
            )}
            style={columnDef.style}
            role="cell"
        >
            {flexRender(columnDef.cell, cell.getContext())}
        </div>
    );
}
