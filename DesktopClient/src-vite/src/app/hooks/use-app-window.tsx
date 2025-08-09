import { getOsType, isWindows } from "@/utils/osType";
import { isTauri } from "@/utils/tauriTools";
import { getCurrentWindow, Window } from "@tauri-apps/api/window";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

const AppWindowContext = createContext<{ context: AppWindowType, setContext: React.Dispatch<React.SetStateAction<AppWindowType>> }>({ context: undefined!, setContext: () => {} });

export function AppWindowProvider({ children }: { children: React.ReactNode }) {
    const [context, setContext] = useState<AppWindowType>(
        {
            appWindow: null,
            isWindowMaximized: false,
            isFullscreen: false,
            isSidebarOpen: false,
            minimizeWindow: async () => {},
            maximizeWindow: async () => {},
            toggleFullscreen: async () => {},
            toggleSidebar: async () => {},
            enterFullscreenWindow: async () => {},
            exitFullscreenWindow: async () => {},
            closeWindow: async () => {},
        }
    );

    return (
        <AppWindowContext.Provider value={{ context, setContext }}>
            {children}
        </AppWindowContext.Provider>
    )

}

interface AppWindowType {
    appWindow: Window | null
    isWindowMaximized: boolean
    isFullscreen: boolean
    isSidebarOpen: boolean
    minimizeWindow: () => Promise<void>
    maximizeWindow: () => Promise<void>
    toggleFullscreen: () => Promise<void>
    toggleSidebar: () => Promise<void>
    enterFullscreenWindow: () => Promise<void>
    exitFullscreenWindow: () => Promise<void>
    closeWindow: () => Promise<void>
}

export function useAppWindow(): AppWindowType {

    const {
        appWindow,
        isFullscreen,
        isWindowMaximized,
        isSidebarOpen,
    } = useContext(AppWindowContext).context;

    const setContext = useContext(AppWindowContext).setContext;

    const setIsFullscreen = (v: boolean) => setContext((prev) => ({ ...prev, isFullscreen: v }));
    const setIsWindowMaximized = (v: boolean) => setContext((prev) => ({ ...prev, isWindowMaximized: v }));
    const setIsSidebarOpen = (v: boolean) => setContext((prev) => ({ ...prev, isSidebarOpen: v }));
    const setAppWindow = (v: Window | null) => setContext((prev) => ({ ...prev, appWindow: v }));

    useEffect(() => {
        const fetchFullscreenStatus = async () => {
            if (appWindow) {
                const fullscreenStatus = await appWindow.isFullscreen();
                setIsFullscreen(fullscreenStatus);
            }
        };

        fetchFullscreenStatus();
    }, [appWindow]);

    useEffect(() => {
        if (typeof window !== "undefined" && isTauri()) {
            setAppWindow(getCurrentWindow());
        }
    }, []);

    // Update the isWindowMaximized state when the window is resized
    const updateIsWindowMaximized = useCallback(async () => {
        if (appWindow) {
            const _isWindowMaximized = await appWindow.isMaximized();
            setIsWindowMaximized(_isWindowMaximized);
        }
    }, [appWindow]);

    const updateIsFullscreen = useCallback(async () => {
        if (appWindow) {
            const _isFullscreen = await appWindow.isFullscreen();
            setIsFullscreen(_isFullscreen);
        }
    }, [appWindow]);

    useEffect(() => {
        if (!isTauri()) return;

        getOsType().then(() => {
            updateIsWindowMaximized();
            updateIsFullscreen();
            let unlisten: () => void = () => {};

            const listen = async () => {
                if (appWindow) {
                    unlisten = await appWindow.onResized(() => {
                        updateIsWindowMaximized();
                        updateIsFullscreen();
                    });
                }
            };
            listen();

            // Cleanup the listener when the component unmounts
            return () => unlisten && unlisten();
        });
    }, [appWindow, updateIsFullscreen, updateIsWindowMaximized]);

    const minimizeWindow = async () => {
        window.igniteView && window.hide();
    };

    const maximizeWindow = async () => {
        window.igniteView && window.toggleMaximize();
    };

    const toggleFullscreen = async () => {
        if (appWindow) {
            const fullscreen = await appWindow.isFullscreen();
            fullscreen ? exitFullscreenWindow() : enterFullscreenWindow();
        }
    };

    const toggleSidebar = async () => setIsSidebarOpen(!isSidebarOpen);

    const enterFullscreenWindow = async () => {
        if (appWindow) {
            const fullscreen = await appWindow.isFullscreen();
            if (!fullscreen) {
                if (isWindows && isWindowMaximized) {
                    await maximizeWindow();
                }

                await appWindow.setFullscreen(true);
                updateIsFullscreen();
            }
        }
    };

    const exitFullscreenWindow = async () => {
        if (appWindow) {
            const fullscreen = await appWindow.isFullscreen();
            if (fullscreen) {
                await appWindow.setFullscreen(false);
                updateIsFullscreen();

                if (isWindows) {
                    await maximizeWindow();
                }
            }
        }
    };

    const closeWindow = async () => {
        await igniteView.commandBridge.cleanUpUI();
        window.close();
    };

    return {
        appWindow,
        isWindowMaximized,
        isFullscreen,
        isSidebarOpen,
        minimizeWindow,
        maximizeWindow,
        closeWindow,
        toggleFullscreen,
        toggleSidebar,
        enterFullscreenWindow,
        exitFullscreenWindow,
    };
}
