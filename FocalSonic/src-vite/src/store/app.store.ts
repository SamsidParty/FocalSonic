import { pingServer } from "@/api/pingServer";
import { queryServerInfo } from "@/api/queryServerInfo";
import { ROUTES } from "@/routes/routesList";
import { ListDisplayMode } from "@/types/listDisplayMode";
import { AuthType, IAppContext, IServerConfig } from "@/types/serverConfig";
import {
    genEncodedPassword,
    genPasswordToken,
} from "@/utils/salt";
import { merge } from "lodash";
import omit from "lodash/omit";
import { useNavigate } from "react-router-dom";
import { createJSONStorage, devtools, persist, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { shallow } from "zustand/shallow";
import { createWithEqualityFn } from "zustand/traditional";
import { usePlayerActions } from "./player.store";

const { SHOW_RADIOS_SECTION, SERVER_TYPE } = window;

const igniteViewAppStore = {
    getItem: async (key: string) => {
        let item = localStorage.getItem(key) || "{\"state\":{\"data\":{}}}";

        if (item && JSON.parse(item)?.state?.data && window.igniteView) {
            // Overwrite the credential state with the one stored by C#
            const overwrittenItem = JSON.parse(item);
            const creds = await window.igniteView?.commandBridge?.getCurrentCredentials();
            
            overwrittenItem.state.data = creds;
            overwrittenItem.state.data.isServerConfigured = !!creds.url;
            console.log("Loading stored credentials:", overwrittenItem.state.data);

            item = JSON.stringify(overwrittenItem);
        }

        return item;
    },
    setItem: async (key: string, value: any) => {
        localStorage.setItem(key, value);
    },
    removeItem: async (key: string) => {
        localStorage.removeItem(key);
    }
};

export const useAppStore = createWithEqualityFn<IAppContext>()(
    subscribeWithSelector(
        persist(
            devtools(
                immer((set, get) => ({
                    data: {
                        isServerConfigured: false,
                        osType: "",
                        url: "",
                        username: "",
                        password: "",
                        authType: AuthType.TOKEN,
                        protocolVersion: "1.16.0",
                        serverType: SERVER_TYPE ?? "subsonic",
                        songCount: null,
                        isHydrated: false,
                    },
                    pages: {
                        showInfoPanel: true,
                        toggleShowInfoPanel: () => {
                            const { showInfoPanel } = get().pages;

                            set((state) => {
                                state.pages.showInfoPanel = !showInfoPanel;
                            });
                        },
                        showRadiosSection: SHOW_RADIOS_SECTION ?? false,
                        setshowRadiosSection: (value) => {
                            set((state) => {
                                state.pages.showRadiosSection = value;
                            });
                        },
                        artistsPageViewType: "table",
                        setArtistsPageViewType: (type) => {
                            set((state) => {
                                state.pages.artistsPageViewType = type;
                            });
                        },
                    },
                    update: {
                        openDialog: false,
                        setOpenDialog: (value) => {
                            set((state) => {
                                state.update.openDialog = value;
                            });
                        },
                        remindOnNextBoot: false,
                        setRemindOnNextBoot: (value) => {
                            set((state) => {
                                state.update.remindOnNextBoot = value;
                            });
                        },
                    },
                    settings: {
                        enableLRCLib: true,
                        setEnableLRCLib: (value) => {
                            set((state) => {
                                state.settings.enableLRCLib = value;
                            });
                        },
                        altLyricsMode: "off",
                        setAltLyricsMode: (value) => {
                            set((state) => {
                                state.settings.altLyricsMode = value;
                            });
                        },
                        sidebarOpen: true,
                        setSidebarOpen: (value) => {
                            set((state) => {
                                state.settings.sidebarOpen = value;
                            });
                        },
                        lyricBackgroundIntensity: 1.01,
                        setLyricBackgroundIntensity: (value) => {
                            set((state) => {
                                state.settings.lyricBackgroundIntensity = value;
                            });
                        },
                        extraBarContent: "none",
                        setExtraBarContent: (value) => {
                            set((state) => {
                                state.settings.extraBarContent = value;
                            });
                        },
                        listDisplayModes: {} as Record<string, ListDisplayMode>,
                        setListDisplayMode: (listName, mode) => {
                            set((state) => {
                                state.settings.listDisplayModes[listName] = mode;
                            });
                        }   
                    },
                    runtimeState: {
                        settingsDialogState: false,
                        setSettingsDialogState: (value) => {
                            set((state) => {
                                state.runtimeState.settingsDialogState = value;
                            });
                        },
                        currentPage: "appearance",
                        setCurrentPage: (page) => {
                            set((state) => {
                                state.runtimeState.currentPage = page;
                            });
                        },
                        logoutDialogState: false,
                        setLogoutDialogState: (value) => {
                            set((state) => {
                                state.runtimeState.logoutDialogState = value;
                            });
                        },
                    },
                    actions: {
                        setOsType: (value) => {
                            set((state) => {
                                state.data.osType = value;
                            });
                        },
                        setUrl: (value) => {
                            set((state) => {
                                state.data.url = value;
                            });
                        },
                        setUsername: (value) => {
                            set((state) => {
                                state.data.username = value;
                            });
                        },
                        setPassword: (value) => {
                            set((state) => {
                                state.data.password = value;
                            });
                        },
                        saveConfig: async ({ url, username, password }: IServerConfig) => {

                            if (url === "applemusic") {
                                return true; // Handled by C#
                            }

                            // try both token and password methods
                            for (const authType of [AuthType.TOKEN, AuthType.PASSWORD]) {

                                const token = authType === AuthType.TOKEN ? genPasswordToken(password) : genEncodedPassword(password);

                                const canConnect = await pingServer(
                                    url,
                                    username,
                                    token,
                                    authType,
                                );

                                const serverInfo = await queryServerInfo(url);

                                if (canConnect) {
                                    set((state) => {
                                        state.data.url = url;
                                        state.data.username = username;
                                        state.data.password = token;
                                        state.data.authType = authType;
                                        state.data.protocolVersion = serverInfo.protocolVersion;
                                        state.data.serverType = serverInfo.serverType;
                                        state.data.isServerConfigured = true;

                                        window.igniteView?.commandBridge?.overwriteCurrentCredentials?.(JSON.stringify(state.data));
                                    });
                                    return true;
                                }
                            }
                            set((state) => {
                                state.data.isServerConfigured = false;
                            });
                            return false;
                        },
                        removeConfig: () => {

                            window.igniteView?.commandBridge?.deleteCurrentCredentials?.();

                            set((state) => {
                                state.data.isServerConfigured = false;
                                state.data.isHydrated = true;
                                state.data.osType = "";
                                state.data.url = "";
                                state.data.username = "";
                                state.data.password = "";
                                state.data.authType = AuthType.TOKEN;
                                state.data.protocolVersion = "1.16.0";
                                state.data.serverType = "subsonic";
                                state.data.songCount = null;
                                state.pages.showInfoPanel = true;
                                state.pages.showRadiosSection = SHOW_RADIOS_SECTION ?? false;
                                state.pages.artistsPageViewType = "grid";
                            });
                        },
                        toggleSidebar: () => {
                            set((state) => {
                                state.settings.sidebarOpen = !state.settings.sidebarOpen;
                            });
                        }
                    },
                })),
                {
                    name: "app_store",
                },
            ),
            {
                name: "app_store",
                version: 1,
                storage: createJSONStorage(() => !window.igniteView ? localStorage : igniteViewAppStore),
                merge: (persistedState, currentState) => {
                    currentState.data.isHydrated = true;
                    return merge(currentState, persistedState);
                },
                partialize: (state) => {
                    const appStore = omit(
                        state,
                        "actions",
                        "data.isHydrated",
                        "update",
                        "runtimeState",
                    );

                    appStore.data.isHydrated = false;

                    return appStore;
                },
            },
        ),
    ),
    shallow,
);

export const useAppData = () => useAppStore((state) => state.data);
export const useAppPages = () => useAppStore((state) => state.pages);
export const useAppActions = () => useAppStore((state) => state.actions);
export const useAppUpdate = () => useAppStore((state) => state.update);
export const useAppRuntimeState = () => useAppStore((state) => state.runtimeState);
export const useAppSettings = () => useAppStore((state) => state.settings);
export const useAppArtistsViewType = () =>
    useAppStore((state) => {
        const { artistsPageViewType, setArtistsPageViewType } = state.pages;

        const isTableView = artistsPageViewType === "table";
        const isGridView = artistsPageViewType === "grid";

        return {
            artistsPageViewType,
            setArtistsPageViewType,
            isTableView,
            isGridView,
        };
    });

export const waitForAppHydration = async () => {
    // Wait until the app store has rehydrated before accessing its state
    if (!useAppStore.getState().data.isHydrated) {
        await new Promise<void>((resolve) => {
            useAppStore.persist.onFinishHydration(() => {
                resolve();
            });
        });
    }
};

export function useSignOut() {
    const { clearPlayerState, resetConfig, disposePlayer } = usePlayerActions();
    const { removeConfig } = useAppActions();
    const navigate = useNavigate();

    return async () => {
        disposePlayer();
        removeConfig();
        clearPlayerState();
        resetConfig();

        if (window.igniteView?.commandBridge) {
            await window.igniteView?.commandBridge.logOutOfAppleMusic();
        }

        navigate(ROUTES.SERVER_CONFIG, { replace: true });
    };
}