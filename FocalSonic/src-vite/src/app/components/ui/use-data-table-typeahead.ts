import { Row, RowSelectionState } from "@tanstack/react-table";
import {
    Dispatch,
    KeyboardEvent as ReactKeyboardEvent,
    MouseEvent as ReactMouseEvent,
    SetStateAction,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

const TYPEAHEAD_RESET_MS = 900;
const TYPEAHEAD_HIGHLIGHT_MS = 1400;
const TYPEAHEAD_KEY_REGEX = /^[a-z0-9]$/i;

const typeAheadOwners = new Set<symbol>();
let activeTypeAheadOwner: symbol | null = null;

type TypeAheadKeyboardEvent = KeyboardEvent | ReactKeyboardEvent<HTMLElement>;

interface UseDataTableTypeAheadArgs<TData> {
    allowRowSelection?: boolean
    enabled?: boolean
    getItemText: (row: Row<TData>) => string | undefined
    onMatch?: (row: Row<TData>) => void
    rows: Row<TData>[]
    setRowSelection: Dispatch<SetStateAction<RowSelectionState>>
}

export function useDataTableTypeAhead<TData>({
    allowRowSelection = true,
    enabled = true,
    getItemText,
    onMatch,
    rows,
    setRowSelection,
}: UseDataTableTypeAheadArgs<TData>) {
    const [typeAheadRowId, setTypeAheadRowId] = useState<string | null>(null);
    const ownerRef = useRef(Symbol("data-table-typeahead"));
    const searchRef = useRef("");
    const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearResetTimer = useCallback(() => {
        if (resetTimerRef.current) {
            clearTimeout(resetTimerRef.current);
        }
    }, []);

    const clearHighlightTimer = useCallback(() => {
        if (highlightTimerRef.current) {
            clearTimeout(highlightTimerRef.current);
        }
    }, []);

    const resetSearch = useCallback(() => {
        searchRef.current = "";
    }, []);

    const scheduleSearchReset = useCallback(() => {
        clearResetTimer();
        resetTimerRef.current = setTimeout(resetSearch, TYPEAHEAD_RESET_MS);
    }, [clearResetTimer, resetSearch]);

    const scheduleHighlightReset = useCallback(() => {
        clearHighlightTimer();
        highlightTimerRef.current = setTimeout(() => {
            setTypeAheadRowId(null);
        }, TYPEAHEAD_HIGHLIGHT_MS);
    }, [clearHighlightTimer]);

    const findMatchingRow = useCallback(
        (search: string) => rows.find((row) => {
            const rowText = getItemText(row)?.trim().toLocaleLowerCase();

            return rowText?.startsWith(search);
        }),
        [getItemText, rows],
    );

    const isActiveOwner = useCallback(() => {
        return typeAheadOwners.size <= 1 || activeTypeAheadOwner === ownerRef.current;
    }, []);

    const activateOwner = useCallback(() => {
        activeTypeAheadOwner = ownerRef.current;
    }, []);

    const handleTypeAheadKey = useCallback(
        (event: TypeAheadKeyboardEvent) => {
            if (!enabled || !isActiveOwner() || shouldIgnoreTypeAheadKey(event)) {
                return;
            }

            const key = event.key.toLocaleLowerCase();
            const combinedSearch = `${searchRef.current}${key}`;
            let nextSearch = combinedSearch;
            let match = findMatchingRow(nextSearch);

            if (!match && searchRef.current) {
                nextSearch = key;
                match = findMatchingRow(nextSearch);
            }

            if (!match) {
                resetSearch();
                return;
            }

            event.preventDefault();
            searchRef.current = nextSearch;
            scheduleSearchReset();
            setTypeAheadRowId(match.id);
            scheduleHighlightReset();

            if (allowRowSelection) {
                setRowSelection({
                    [match.id]: true,
                });
            }

            onMatch?.(match);
        },
        [
            allowRowSelection,
            enabled,
            findMatchingRow,
            isActiveOwner,
            onMatch,
            resetSearch,
            scheduleHighlightReset,
            scheduleSearchReset,
            setRowSelection,
        ],
    );

    const handleTypeAheadKeyDown = useCallback(
        (event: ReactKeyboardEvent<HTMLElement>) => {
            handleTypeAheadKey(event);
        },
        [handleTypeAheadKey],
    );

    const handleTypeAheadMouseEnter = useCallback(() => {
        if (enabled) {
            activateOwner();
        }
    }, [activateOwner, enabled]);

    const handleTypeAheadMouseDown = useCallback((event: ReactMouseEvent<HTMLElement>) => {
        if (!enabled || shouldIgnoreTypeAheadTarget(event.target)) {
            return;
        }

        activateOwner();
        event.currentTarget.focus({ preventScroll: true });
    }, [activateOwner, enabled]);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        const owner = ownerRef.current;
        typeAheadOwners.add(owner);

        if (!activeTypeAheadOwner) {
            activeTypeAheadOwner = owner;
        }

        return () => {
            typeAheadOwners.delete(owner);

            if (activeTypeAheadOwner === owner) {
                activeTypeAheadOwner = typeAheadOwners.values().next().value ?? null;
            }
        };
    }, [enabled]);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        document.addEventListener("keydown", handleTypeAheadKey);

        return () => {
            document.removeEventListener("keydown", handleTypeAheadKey);
        };
    }, [enabled, handleTypeAheadKey]);

    useEffect(() => {
        return () => {
            clearResetTimer();
            clearHighlightTimer();
        };
    }, [clearHighlightTimer, clearResetTimer]);

    return {
        handleTypeAheadKeyDown,
        handleTypeAheadMouseEnter,
        handleTypeAheadMouseDown,
        typeAheadRowId,
    };
}

function shouldIgnoreTypeAheadKey(event: TypeAheadKeyboardEvent) {
    if (
        event.defaultPrevented
        || event.isComposing
        || event.altKey
        || event.ctrlKey
        || event.metaKey
    ) {
        return true;
    }

    if (shouldIgnoreTypeAheadTarget(event.target)) {
        return true;
    }

    return !TYPEAHEAD_KEY_REGEX.test(event.key);
}

function shouldIgnoreTypeAheadTarget(target: EventTarget | null) {
    if (!(target instanceof Element)) {
        return false;
    }

    return Boolean(target.closest([
        "a",
        "button",
        "input",
        "select",
        "textarea",
        "[contenteditable='true']",
        "[role='button']",
        "[role='checkbox']",
        "[role='combobox']",
        "[role='menuitem']",
        "[role='textbox']",
    ].join(",")));
}
