import { toast } from "react-toastify";
import { create } from "zustand";

/**
 * Listen Together status, mirrored from C# (FocalSonic/ListenTogether). The session itself
 * runs entirely in C# so it carries on with the window closed; this is only what the UI shows.
 */

export type ListenTogetherRole = "host" | "guest";
export type ListenTogetherPhase = "idle" | "starting" | "connecting" | "live" | "reconnecting" | "ended" | "failed";
export type ListenTogetherSync = "waiting" | "starting" | "synced" | "syncing" | "buffering" | "struggling" | "paused" | "unavailable" | "offline";

export interface ListenTogetherParticipant {
    id: string
    name: string
    host: boolean
    you: boolean
    state: "connected" | "reconnecting"
    sync: ListenTogetherSync
    drift?: number | null
    route?: "direct" | "relay" | null
    rtt?: number | null
    sf?: string
}

export interface ListenTogetherStatus {
    active: boolean
    phase: ListenTogetherPhase
    role?: ListenTogetherRole
    error?: string | null
    endReason?: string | null
    code?: string
    you?: string
    name?: string
    hostName?: string
    participants?: ListenTogetherParticipant[]
    route?: "direct" | "relay" | null
    rtt?: number | null
    sync?: { state: ListenTogetherSync, drift?: number | null, corrections?: number }
    current?: { entry?: string | null, blocked?: boolean, substituted?: boolean, title?: string | null }
    /** Entry id → participant id, for songs someone else added. */
    addedBy?: Record<string, string>
    /** Entry id → participants who can't play it. */
    unavailable?: Record<string, string[]>
}

interface ListenTogetherStore {
    status: ListenTogetherStatus
    dialogOpen: boolean
    setDialogOpen: (open: boolean) => void
    setStatus: (status: ListenTogetherStatus) => void
}

const idle: ListenTogetherStatus = { active: false, phase: "idle" };

export const useListenTogetherStore = create<ListenTogetherStore>((set) => ({
    status: idle,
    dialogOpen: false,
    setDialogOpen: (dialogOpen) => set({ dialogOpen }),
    setStatus: (status) => set({ status }),
}));

function parseStatus(json: unknown): ListenTogetherStatus | null {
    if (typeof json !== "string") return null;
    try {
        const parsed = JSON.parse(json);
        return parsed && typeof parsed === "object" ? parsed as ListenTogetherStatus : null;
    }
    catch {
        return null;
    }
}

const bridge = () => window.igniteView?.commandBridge;

window.listenTogetherStatusChanged = (json: string) => {
    const status = parseStatus(json);
    if (status) useListenTogetherStore.getState().setStatus(status);
};

window.listenTogetherNotify = (level: string, message: string) => {
    if (!message) return;
    const options = { toastId: `lt-${message}`, autoClose: level === "error" || level === "warning" ? 6000 : 3500 };
    if (level === "error") toast.error(message, options);
    else if (level === "warning") toast.warn(message, options);
    else if (level === "success") toast.success(message, options);
    else toast.info(message, options);
};

/** Picks up a session that was already running (the window was closed and reopened). */
export async function refreshListenTogetherStatus() {
    try {
        const status = parseStatus(await bridge()?.getListenTogetherStatus?.());
        if (status) useListenTogetherStore.getState().setStatus(status);
    }
    catch {
        // Not available (browser build): stays idle.
    }
}

interface CommandResult { ok: boolean, error?: string | null, status?: ListenTogetherStatus }

async function call(command: string, ...args: unknown[]): Promise<CommandResult> {
    const fn = bridge()?.[command];
    if (typeof fn !== "function") return { ok: false, error: "Listen Together needs the FocalSonic desktop app." };
    try {
        const raw = await fn(...args);
        const result = typeof raw === "string" ? JSON.parse(raw) as CommandResult : { ok: true };
        if (result.status) useListenTogetherStore.getState().setStatus(result.status);
        return result;
    }
    catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
}

export const listenTogether = {
    host: (name: string) => call("listenTogetherHost", name),
    join: (code: string, name: string) => call("listenTogetherJoin", code, name),
    leave: async () => {
        await call("listenTogetherLeave");
        useListenTogetherStore.getState().setStatus(idle);
    },
    displayName: async (): Promise<string> => {
        try { return (await bridge()?.getListenTogetherDisplayName?.()) ?? ""; }
        catch { return ""; }
    },
};

export const useListenTogetherStatus = () => useListenTogetherStore((state) => state.status);
export const useIsInListenTogether = () => useListenTogetherStore((state) => state.status.active && state.status.phase !== "failed");

void refreshListenTogetherStatus();
