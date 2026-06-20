import { create } from "zustand";

export type SyncStatus = "idle" | "syncing" | "success" | "error"

interface SyncState {
    status: SyncStatus
    /** Target song count (0 while still unknown / probing). */
    total: number
    /** Songs fetched so far this run. */
    synced: number
    lastSyncedAt: number | null
    error: string | null
    actions: {
        start: () => void
        setTotal: (total: number) => void
        addSynced: (count: number) => void
        finish: (lastSyncedAt: number) => void
        fail: (error: string) => void
        reset: () => void
    }
}

export const useSyncStore = create<SyncState>((set) => ({
    status: "idle",
    total: 0,
    synced: 0,
    lastSyncedAt: null,
    error: null,
    actions: {
        start: () => set({ status: "syncing", synced: 0, total: 0, error: null }),
        setTotal: (total) => set({ total }),
        addSynced: (count) => set((state) => ({ synced: state.synced + count })),
        finish: (lastSyncedAt) => set({ status: "success", lastSyncedAt }),
        fail: (error) => set({ status: "error", error }),
        reset: () => set({ status: "idle", total: 0, synced: 0, error: null }),
    },
}));

export const useSyncStatus = () => useSyncStore((state) => state.status);
export const useSyncActions = () => useSyncStore((state) => state.actions);
export const useSyncProgress = () =>
    useSyncStore((state) => ({ synced: state.synced, total: state.total }));
