import { getOsType } from "@/utils/osType";
import { isTauri } from "@/utils/tauriTools";
import { getCurrentWindow, Window } from "@tauri-apps/api/window";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

const AppWindowContext = createContext<{ context: AppWindowType, setContext: React.Dispatch<React.SetStateAction<AppWindowType>> }>({ context: undefined!, setContext: () => {} });

export function AppWindowProvider({ children }: { children: React.ReactNode }) {
    const [context, setContext] = useState<AppWindowType>(
        {
            appWindow: null,
            isWindowMaximized: false,
            minimizeWindow: async () => {},
            maximizeWindow: async () => {},
            closeWindow: async () => {},
        }
    );

    return (
        <AppWindowContext.Provider value={{ context, setContext }}>
            {children}
        </AppWindowContext.Provider>
    );

}

interface AppWindowType {
    appWindow: Window | null
    isWindowMaximized: boolean
    minimizeWindow: () => Promise<void>
    maximizeWindow: () => Promise<void>
    closeWindow: () => Promise<void>
}

export function useAppWindow(): AppWindowType {
    const {
        appWindow,
        isWindowMaximized,
    } = useContext(AppWindowContext).context;

    const setContext = useContext(AppWindowContext).setContext;

    const setIsWindowMaximized = (v: boolean) => setContext((prev) => ({ ...prev, isWindowMaximized: v }));
    const setAppWindow = (v: Window | null) => setContext((prev) => ({ ...prev, appWindow: v }));

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

    useEffect(() => {
        if (!isTauri()) return;

        getOsType().then(() => {
            updateIsWindowMaximized();
            let unlisten: () => void = () => {};

            const listen = async () => {
                if (appWindow) {
                    unlisten = await appWindow.onResized(() => {
                        updateIsWindowMaximized();
                    });
                }
            };
            listen();

            // Cleanup the listener when the component unmounts
            return () => unlisten && unlisten();
        });
    }, [appWindow, updateIsWindowMaximized]);

    const minimizeWindow = async () => {
        window.igniteView && window.hide();
    };

    const maximizeWindow = async () => {
        window.igniteView && window.toggleMaximize();
    };

    const closeWindow = async () => {
        await window.igniteView?.commandBridge.cleanUpUI();
        window.close();
    };

    return {
        appWindow,
        isWindowMaximized,
        minimizeWindow,
        maximizeWindow,
        closeWindow,
    };
}
