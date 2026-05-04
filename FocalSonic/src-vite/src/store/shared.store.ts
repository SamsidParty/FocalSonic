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

interface ISharedStoreState {
    enableDiscordPresence: boolean
    enableAtmos: boolean
    enableExponentialVolume: boolean
    volume: number
}

interface ISharedStoreActions {
    setEnableDiscordPresence: (value: boolean) => void
    setEnableAtmos: (value: boolean) => void
    setEnableExponentialVolume: (value: boolean) => void
    setVolume: (value: number) => void
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
    enableExponentialVolume: false,
    volume: 100,
};

const sharedVolumeSettings = {
    min: 0,
    max: 100,
    step: 1,
    wheelStep: 5,
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
    return {
        enableDiscordPresence: Boolean(state?.enableDiscordPresence),
        enableAtmos: Boolean(state?.enableAtmos),
        enableExponentialVolume: Boolean(state?.enableExponentialVolume),
        volume: clamp(Number(state?.volume ?? sharedStoreDefaults.volume), sharedVolumeSettings.min, sharedVolumeSettings.max),
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

const sharedStoreStorage = {
    getItem: async (key: string) => {
        if (key !== "shared_store") {
            return null;
        }

        const storedValue = window.igniteView?.commandBridge?.getSharedStore
            ? await window.igniteView.commandBridge.getSharedStore()
            : localStorage.getItem(key);

        if (typeof storedValue === "string" && storedValue.trim() && storedValue !== "{}") {
            return storedValue;
        }

        return getLegacySharedStoreValue();
    },
    setItem: async (key: string, value: string) => {
        if (key !== "shared_store") {
            return;
        }

        if (window.igniteView?.commandBridge?.setSharedStore) {
            await window.igniteView.commandBridge.setSharedStore(value);
            return;
        }

        localStorage.setItem(key, value);
    },
    removeItem: async (key: string) => {
        if (key !== "shared_store") {
            return;
        }

        if (window.igniteView?.commandBridge?.setSharedStore) {
            await window.igniteView.commandBridge.setSharedStore("{}");
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
                        setEnableExponentialVolume: (value) => {
                            set((state) => {
                                state.enableExponentialVolume = value;
                            });
                        },
                        setVolume: (value) => {
                            const finalVolume = clamp(value, sharedVolumeSettings.min, sharedVolumeSettings.max);

                            set((state) => {
                                state.volume = finalVolume;
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
                merge: (persistedState, currentState) => ({
                    ...currentState,
                    ...sanitizeSharedState(persistedState as Partial<ISharedStoreState>),
                    actions: currentState.actions,
                }),
                partialize: (state) => ({
                    enableDiscordPresence: state.enableDiscordPresence,
                    enableAtmos: state.enableAtmos,
                    enableExponentialVolume: state.enableExponentialVolume,
                    volume: state.volume,
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
    enableExponentialVolume: useSharedStore((state) => state.enableExponentialVolume),
    setEnableExponentialVolume: useSharedStore((state) => state.actions.setEnableExponentialVolume),
});

export const useSharedVolume = () => ({
    volume: useSharedStore((state) => state.volume),
    setVolume: useSharedStore((state) => state.actions.setVolume),
    handleVolumeWheel: useSharedStore((state) => state.actions.handleVolumeWheel),
});

export const getSharedVolume = () => useSharedStore.getState().volume;

export const useExponentialVolume = () => ({
    enableExponentialVolume: useSharedStore((state) => state.enableExponentialVolume),
    setEnableExponentialVolume: useSharedStore((state) => state.actions.setEnableExponentialVolume),
});
