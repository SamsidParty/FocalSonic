import clamp from "lodash/clamp";
import {
    createJSONStorage,
    devtools,
    persist,
    subscribeWithSelector,
} from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { shallow } from "zustand/shallow";
import { createWithEqualityFn } from "zustand/traditional";
import { sanitizeStoredFilterData, sanitizeStoredSpeed } from "@/utils/audioEffects";

interface ISharedStoreState {
    enableDiscordPresence: boolean
    enableAtmos: boolean
    volume: number
    /** Playback speed. A negative value means "disabled, but remember this level". */
    speed: number
    /** Serialized EQ bands, with reverb and the impulse response on band 0. */
    filterData: string
}

interface ISharedStoreActions {
    setEnableDiscordPresence: (value: boolean) => void
    setEnableAtmos: (value: boolean) => void
    setVolume: (value: number) => void
    setSpeed: (value: number) => void
    setFilterData: (value: string) => void
    handleVolumeWheel: (isScrollingDown: boolean) => void
}

interface ISharedStore extends ISharedStoreState {
    actions: ISharedStoreActions
}

interface ILegacyAppStoreState {
    settings?: {
        enableDiscordPresence?: boolean
        enableAtmos?: boolean
    }
}

interface ILegacyPlayerStoreState {
    playerState?: {
        volume?: number
    }
}

interface ILegacySharedStoreState {
    settings?: {
        enableDiscordPresence?: boolean
        enableAtmos?: boolean
    }
    playerState?: {
        volume?: number
    }
}

const sharedStoreDefaults: ISharedStoreState = {
    enableDiscordPresence: false,
    enableAtmos: false,
    volume: 100,
    speed: 1,
    filterData: "",
};

const sharedVolumeSettings = {
    min: 0,
    max: 100,
    step: 1,
    wheelStep: 2,
};

function parseJSON<T>(value: string | null | undefined) {
    if (!value) {
        return null as T | null;
    }

    try {
        return JSON.parse(value) as T;
    }
    catch {
        return null as T | null;
    }
}

function sanitizeSharedState(state?: Partial<ISharedStoreState>) {
    const speed = sanitizeStoredSpeed(state?.speed);

    return {
        enableDiscordPresence: Boolean(state?.enableDiscordPresence),
        enableAtmos: Boolean(state?.enableAtmos),
        volume: clamp(Number(state?.volume ?? sharedStoreDefaults.volume), sharedVolumeSettings.min, sharedVolumeSettings.max),
        speed,
        filterData: sanitizeStoredFilterData(state?.filterData, speed),
    } satisfies ISharedStoreState;
}

function getLegacySharedStoreValue() {
    const appStore = parseJSON<{ state?: ILegacyAppStoreState }>(localStorage.getItem("app_store"))?.state;
    const playerStore = parseJSON<{ state?: ILegacyPlayerStoreState }>(localStorage.getItem("player_store"))?.state;

    const hasLegacyValue =
        typeof appStore?.settings?.enableDiscordPresence === "boolean" ||
        typeof appStore?.settings?.enableAtmos === "boolean" ||
        typeof playerStore?.playerState?.volume === "number";

    if (!hasLegacyValue) {
        return null;
    }

    return JSON.stringify({
        state: {
            settings: {
                enableDiscordPresence: appStore?.settings?.enableDiscordPresence,
                enableAtmos: appStore?.settings?.enableAtmos,
            },
            playerState: {
                volume: playerStore?.playerState?.volume,
            },
        },
        version: 0,
    });
}

// True once the real stored state is in. Until then zustand still writes on every set(),
// and those writes carry the defaults (volume 100, speed 1, no effects) over the saved ones.
let sharedStoreReady = false;

// Set when the stored state couldn't be read at all. The UI keeps working with defaults,
// but they must never be written back.
let sharedStoreHydrationFailed = false;
let sharedHydrationRetryTimer: ReturnType<typeof setTimeout> | null = null;
let sharedHydrationRetries = 0;
const sharedStoreReadyListeners = new Set<() => void>();

/** Whether volume, speed and effects hold the saved values rather than defaults. */
export const isSharedStoreReady = () => sharedStoreReady;

export function onSharedStoreReady(listener: () => void) {
    if (sharedStoreReady) {
        listener();
        return () => undefined;
    }

    sharedStoreReadyListeners.add(listener);
    return () => { sharedStoreReadyListeners.delete(listener); };
}

function scheduleSharedHydrationRetry() {
    if (sharedHydrationRetryTimer || sharedHydrationRetries >= 10) {
        return;
    }

    const delay = Math.min(1000 * 2 ** sharedHydrationRetries, 30000);
    sharedHydrationRetries++;

    sharedHydrationRetryTimer = setTimeout(() => {
        sharedHydrationRetryTimer = null;
        void useSharedStore.persist.rehydrate();
    }, delay);
}

const isDesktop = () => Boolean(window.igniteView);

/**
 * IgniteView fills in commandBridge asynchronously (it has to ask the host for the command
 * list first), so at module load getSharedStore often doesn't exist yet. Falling back to
 * localStorage then read the wrong place (C# keeps this store in its own namespace) and
 * hydrated defaults, which the next write saved over the real settings.
 */
async function waitForBridgeCommand(name: string, timeoutMs = 15000) {
    const deadline = Date.now() + timeoutMs;

    for (let attempt = 0; ; attempt++) {
        const command = window.igniteView?.commandBridge?.[name];
        if (typeof command === "function") {
            return command as (...args: unknown[]) => Promise<unknown>;
        }

        if (Date.now() >= deadline) {
            return null;
        }

        await new Promise((resolve) => setTimeout(resolve, Math.min(50 * (attempt + 1), 500)));
    }
}

const sharedStoreStorage = {
    getItem: async (key: string) => {
        if (key !== "shared_store") {
            return null;
        }

        let storedValue: unknown;

        if (isDesktop()) {
            const getSharedStore = await waitForBridgeCommand("getSharedStore");

            try {
                storedValue = getSharedStore ? await getSharedStore() : undefined;
            }
            catch (error) {
                console.warn("[Shared Store] getSharedStore failed", error);
            }

            if (typeof storedValue !== "string") {
                // Couldn't read it - which is not the same as nothing being saved.
                sharedStoreHydrationFailed = true;
                return null;
            }
        }
        else {
            storedValue = localStorage.getItem(key);
        }

        sharedStoreHydrationFailed = false;
        sharedHydrationRetries = 0;

        // Corrupt data counts as nothing saved, so the next write replaces it (rather than
        // failing hydration, which would block saving for good).
        if (typeof storedValue === "string" && storedValue.trim() && storedValue !== "{}" && parseJSON(storedValue)) {
            return storedValue;
        }

        return getLegacySharedStoreValue();
    },
    setItem: async (key: string, value: string) => {
        if (key !== "shared_store" || !sharedStoreReady) {
            return;
        }

        if (isDesktop()) {
            const setSharedStore = window.igniteView?.commandBridge?.setSharedStore;
            // Never localStorage on desktop: C# wouldn't see it, and it would be read back
            // as a "legacy" value later.
            if (typeof setSharedStore === "function") {
                await setSharedStore(value);
            }
            return;
        }

        localStorage.setItem(key, value);
    },
    removeItem: async (key: string) => {
        if (key !== "shared_store") {
            return;
        }

        if (isDesktop()) {
            await window.igniteView?.commandBridge?.setSharedStore?.("{}");
            return;
        }

        localStorage.removeItem(key);
    },
};

export const useSharedStore = createWithEqualityFn<ISharedStore>()(
    subscribeWithSelector(
        persist(
            devtools(
                immer((set, get) => ({
                    ...sharedStoreDefaults,
                    actions: {
                        setEnableDiscordPresence: (value) => {
                            set((state) => {
                                state.enableDiscordPresence = value;
                            });
                        },
                        setEnableAtmos: (value) => {
                            set((state) => {
                                state.enableAtmos = value;
                            });
                        },
                        setVolume: (value) => {
                            const finalVolume = clamp(value, sharedVolumeSettings.min, sharedVolumeSettings.max);

                            set((state) => {
                                state.volume = finalVolume;
                            });
                        },
                        setSpeed: (value) => {
                            const finalSpeed = sanitizeStoredSpeed(value);

                            set((state) => {
                                state.speed = finalSpeed;
                            });
                        },
                        setFilterData: (value) => {
                            set((state) => {
                                state.filterData = sanitizeStoredFilterData(value, state.speed);
                            });
                        },
                        handleVolumeWheel: (isScrollingDown) => {
                            const volumeAdjustment = isScrollingDown ? -sharedVolumeSettings.wheelStep : sharedVolumeSettings.wheelStep;
                            const nextVolume = clamp(get().volume + volumeAdjustment, sharedVolumeSettings.min, sharedVolumeSettings.max);

                            set((state) => {
                                state.volume = nextVolume;
                            });
                        },
                    },
                })),
                {
                    name: "shared_store",
                },
            ),
            {
                name: "shared_store",
                version: 1,
                storage: createJSONStorage(() => sharedStoreStorage),
                migrate: (persistedState, version) => {
                    if (version === 0) {
                        const legacyState = persistedState as ILegacySharedStoreState;
                        return sanitizeSharedState({
                            enableDiscordPresence: legacyState.settings?.enableDiscordPresence,
                            enableAtmos: legacyState.settings?.enableAtmos,
                            volume: legacyState.playerState?.volume,
                        });
                    }

                    return sanitizeSharedState(persistedState as Partial<ISharedStoreState>);
                },
                merge: (persistedState, currentState) => {
                    // Nothing was read: keep what we have (defaults, or what the user has
                    // changed meanwhile) rather than resetting it.
                    if (sharedStoreHydrationFailed) {
                        return currentState;
                    }

                    // Set before zustand applies the state, so a migration's own write
                    // (which runs right after) is allowed through.
                    sharedStoreReady = true;

                    return {
                        ...currentState,
                        ...sanitizeSharedState(persistedState as Partial<ISharedStoreState>),
                        actions: currentState.actions,
                    };
                },
                onRehydrateStorage: () => (_state, error) => {
                    if (error || sharedStoreHydrationFailed) {
                        console.warn("[Shared Store] Hydration failed; not saving until it succeeds", error);
                        scheduleSharedHydrationRetry();
                        return;
                    }

                    const listeners = Array.from(sharedStoreReadyListeners);
                    sharedStoreReadyListeners.clear();
                    listeners.forEach((listener) => listener());
                },
                partialize: (state) => ({
                    enableDiscordPresence: state.enableDiscordPresence,
                    enableAtmos: state.enableAtmos,
                    volume: state.volume,
                    speed: state.speed,
                    filterData: state.filterData,
                }),
            },
        ),
    ),
    shallow,
);

window.rehydrateSharedStore = async (newState) => {
    const nextState = sanitizeSharedState(parseJSON<{ state?: Partial<ISharedStoreState> }>(newState)?.state);
    const current = useSharedStore.getState();

    useSharedStore.setState(
        {
            ...current,
            ...nextState,
            actions: current.actions,
        },
        true,
    );
};

export const useSharedSettings = () => ({
    enableDiscordPresence: useSharedStore((state) => state.enableDiscordPresence),
    setEnableDiscordPresence: useSharedStore((state) => state.actions.setEnableDiscordPresence),
    enableAtmos: useSharedStore((state) => state.enableAtmos),
    setEnableAtmos: useSharedStore((state) => state.actions.setEnableAtmos),
});

export const useSharedVolume = () => ({
    volume: useSharedStore((state) => state.volume),
    setVolume: useSharedStore((state) => state.actions.setVolume),
    handleVolumeWheel: useSharedStore((state) => state.actions.handleVolumeWheel),
});

export const getSharedVolume = () => useSharedStore.getState().volume;
export const getSharedSpeed = () => useSharedStore.getState().speed;
export const getSharedFilterData = () => useSharedStore.getState().filterData;
