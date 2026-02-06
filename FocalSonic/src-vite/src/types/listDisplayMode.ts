import { useAppStore } from "@/store/app.store";

export type ListDisplayMode = "grid" | "3dshelf" | "list";

export const useListDisplayMode = (listName: string, defaultMode: ListDisplayMode = "grid") =>
    useAppStore((state) => {
        const { listDisplayModes, setListDisplayMode } = state.settings;

        return {
            displayMode: listDisplayModes[listName] || defaultMode,
            setDisplayMode: (mode: ListDisplayMode) => {
                setListDisplayMode(listName, mode);
            }
        };
    });
