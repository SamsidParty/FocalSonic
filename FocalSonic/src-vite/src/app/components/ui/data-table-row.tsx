import { ContextMenuProvider } from "@/app/components/table/context-menu";
import { usePlayerCurrentSong } from "@/store/player.store";
import { ColumnDefType } from "@/types/react-table/columnDef";
import { Cell, flexRender, Row } from "@tanstack/react-table";
import clsx from "clsx";
import { ComponentPropsWithoutRef, ReactNode } from "react";

interface RowProps<TData> extends ComponentPropsWithoutRef<"div"> {
    index: number
    row: Row<TData>
    contextMenuOptions: ReactNode
    isPrevRowSelected: (rowIndex: number) => boolean
    isNextRowSelected: (rowIndex: number) => boolean
    isTypeAheadMatch?: boolean
    variant?: "classic" | "modern"
    dataType?: "song" | "artist" | "playlist" | "radio" | "album"
}

export function TableRow<TData>({
    index,
    row,
    contextMenuOptions,
    variant,
    dataType,
    isPrevRowSelected,
    isNextRowSelected,
    isTypeAheadMatch = false,
    ...props
}: RowProps<TData>) {
    const currentSong = usePlayerCurrentSong();

    const isClassic = variant === "classic";
    const isModern = variant === "modern";
    const isRowSongActive = dataType === "song"
        && (row.original as { id?: string }).id === currentSong.id;

    return (
        <ContextMenuProvider options={contextMenuOptions}>
            <div
                {...props}
                role="row"
                data-test-id="table-row"
                data-row-index={index}
                data-state={row.getIsSelected() && "selected"}
                data-typeahead-match={isTypeAheadMatch ? "true" : undefined}
                className={clsx(
                    "group/tablerow w-full flex flex-row transition-colors",
                    isModern &&
            row.getIsSelected() &&
            !isPrevRowSelected(index) &&
            "rounded-t-md",
                    isModern &&
            row.getIsSelected() &&
            !isNextRowSelected(index) &&
            "rounded-b-md",
                    isModern && !row.getIsSelected() && "rounded-md",
                    "hover:bg-foreground/20 data-[state=selected]:bg-foreground/30",
                    "data-[typeahead-match=true]:bg-foreground/30] data-[typeahead-match=true]:animate-highlight-flash",
                    "data-[typeahead-match=true]:[&_a]:text-foreground data-[typeahead-match=true]:[&_span]:text-foreground",
                    isClassic && "border-b",
                    isRowSongActive && isModern && "row-active bg-foreground/20",
                )}

                /* Stagger and highlight flash */
                style={{
                    animationName: `rowStaggerAnimation, ${isTypeAheadMatch ? "highlight-flash" : "none"}`,
                    animationDelay: `${(Math.min(index, 10) + 1) * 50}ms, -500ms`,
                    animationDuration: "1000ms, 1400ms",
                    animationFillMode: "both, none",
                    animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1), ease-out"
                }}
            >
                {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} cell={cell} />
                ))}
            </div>
        </ContextMenuProvider>
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
                "p-2 flex flex-row items-center justify-start [&:has([role=checkbox])]:pr-4",
                columnDef.className,
            )}
            style={columnDef.style}
            role="cell"
        >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </div>
    );
}
