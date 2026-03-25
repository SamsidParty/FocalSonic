import { IUiContext } from "@/types/uiContext";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { createWithEqualityFn } from "zustand/traditional";

export const useUiStore = createWithEqualityFn<IUiContext>()(
    subscribeWithSelector(
        devtools(
            immer((set) => ({
                itemInfo: {
                    target: null,
                    setTarget: (target) => {
                        set((state) => {
                            state.itemInfo.target = target;
                        });
                    },
                    modalOpen: false,
                    setModalOpen: (open) => {
                        set((state) => {
                            state.itemInfo.modalOpen = open;
                        });
                    },
                    openInfo: (target) => {
                        set((state) => {
                            state.itemInfo.target = target;
                            state.itemInfo.modalOpen = true;
                        });
                    },
                    reset: () => {
                        set((state) => {
                            state.itemInfo.target = null;
                            state.itemInfo.modalOpen = false;
                        });
                    },
                },
            })),
            {
                name: "ui_store",
            },
        ),
    ),
);

export const useItemInfo = () => useUiStore((state) => state.itemInfo);
export const useSongInfo = useItemInfo;
