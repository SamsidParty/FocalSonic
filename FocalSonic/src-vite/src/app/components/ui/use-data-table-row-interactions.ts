import { Row, RowSelectionState, Table } from "@tanstack/react-table";
import { Dispatch, MouseEvent, SetStateAction, TouchEvent, useCallback, useEffect, useRef, useState } from "react";
import { isMacOs } from "react-device-detect";
import { useHotkeys } from "react-hotkeys-hook";

import { MouseButton } from "@/utils/browser";
import { computeMultiSelectedRows } from "@/utils/dataTable";

interface UseDataTableRowInteractionsArgs<TData> {
    allowRowSelection: boolean
    handleActivateRow?: (row: Row<TData>) => void
    handlePrimaryAction?: (row: Row<TData>) => void
    rowSelection: RowSelectionState
    setRowSelection: Dispatch<SetStateAction<RowSelectionState>>
    table: Table<TData>
}

export function useDataTableRowInteractions<TData>({
    allowRowSelection,
    handleActivateRow,
    handlePrimaryAction,
    rowSelection,
    setRowSelection,
    table,
}: UseDataTableRowInteractionsArgs<TData>) {
    const [lastRowSelected, setLastRowSelected] = useState<number | null>(null);
    const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isTapRef = useRef(false);
    const selectedRowCount = Object.keys(rowSelection).length;

    const isRowSelected = useCallback(
        (rowIndex: number) => Boolean(rowSelection[rowIndex]),
        [rowSelection],
    );

    const isPrevRowSelected = useCallback(
        (rowIndex: number) => Boolean(rowSelection[rowIndex - 1]),
        [rowSelection],
    );

    const isNextRowSelected = useCallback(
        (rowIndex: number) => Boolean(rowSelection[rowIndex + 1]),
        [rowSelection],
    );

    const selectAllRows = useCallback(
        (state = true) => {
            if (!allowRowSelection) {
                return;
            }

            table.toggleAllRowsSelected(state);
        },
        [allowRowSelection, table],
    );

    useHotkeys("mod+a", () => selectAllRows(), {
        preventDefault: true,
        enabled: allowRowSelection && !table.getIsAllRowsSelected(),
    });

    useHotkeys("esc", () => selectAllRows(false), {
        preventDefault: true,
        enabled: allowRowSelection && selectedRowCount > 0,
    });

    const handleLeftClick = useCallback(
        (event: MouseEvent<HTMLDivElement>, row: Row<TData>) => {
            if (!allowRowSelection) {
                handlePrimaryAction?.(row);
                return;
            }

            const isMultiSelectKey = isMacOs ? event.metaKey : event.ctrlKey;

            if (isMultiSelectKey) {
                row.toggleSelected();
                setLastRowSelected(row.index);
                return;
            }

            if (event.shiftKey && lastRowSelected !== null) {
                setRowSelection(computeMultiSelectedRows(lastRowSelected, row.index));
                return;
            }

            handlePrimaryAction?.(row);
            setRowSelection({
                [row.index]: true,
            });
            setLastRowSelected(row.index);
        },
        [allowRowSelection, handlePrimaryAction, lastRowSelected, setRowSelection],
    );

    const handleRightClick = useCallback(
        (row: Row<TData>) => {
            if (!allowRowSelection) {
                return;
            }

            if (selectedRowCount > 0 && !isRowSelected(row.index)) {
                table.resetRowSelection();
            }

            row.toggleSelected(true);
            setLastRowSelected(row.index);
        },
        [allowRowSelection, isRowSelected, selectedRowCount, table],
    );

    const handleClicks = useCallback(
        (event: MouseEvent<HTMLDivElement>, row: Row<TData>) => {
            if (event.nativeEvent.button === MouseButton.Left) {
                handleLeftClick(event, row);
            }

            if (event.nativeEvent.button === MouseButton.Right) {
                handleRightClick(row);
            }
        },
        [handleLeftClick, handleRightClick],
    );

    const handleRowDoubleClick = useCallback(
        (event: MouseEvent<HTMLDivElement>, row: Row<TData>) => {
            if (!handleActivateRow) {
                return;
            }

            event.stopPropagation();
            handleActivateRow(row);
        },
        [handleActivateRow],
    );

    const handleTouchStart = useCallback(() => {
        isTapRef.current = true;
        tapTimeoutRef.current = setTimeout(() => {
            isTapRef.current = false;
        }, 500);
    }, []);

    const handleTouchMove = useCallback(() => {
        isTapRef.current = false;
    }, []);

    const handleTouchEnd = useCallback(
        (event: TouchEvent<HTMLDivElement>, row: Row<TData>) => {
            if (tapTimeoutRef.current) {
                clearTimeout(tapTimeoutRef.current);
            }

            if (isTapRef.current && handleActivateRow) {
                event.stopPropagation();
                handleActivateRow(row);
            }

            isTapRef.current = false;
        },
        [handleActivateRow],
    );

    const handleTouchCancel = useCallback(() => {
        if (tapTimeoutRef.current) {
            clearTimeout(tapTimeoutRef.current);
        }

        isTapRef.current = false;
    }, []);

    useEffect(() => {
        return () => {
            if (tapTimeoutRef.current) {
                clearTimeout(tapTimeoutRef.current);
            }
        };
    }, []);

    return {
        handleClicks,
        handleRowDoubleClick,
        handleTouchCancel,
        handleTouchEnd,
        handleTouchMove,
        handleTouchStart,
        isNextRowSelected,
        isPrevRowSelected,
        isRowSelected,
        selectedRowCount,
    };
}