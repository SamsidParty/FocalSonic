import { followNativeFullscreen, useWindowStore } from "@/store/window.store";
import { useEffect } from "react";
import { useHotkeys } from "react-hotkeys-hook";

/** Wires the ways into and out of fullscreen that don't go through a button in the app. */
export function WindowModeObserver() {
    useHotkeys("f11", () => {
        // In a browser, F11 is the browser's own fullscreen.
        if (!window.igniteView) return;

        const { mode, setFullscreenPlayer } = useWindowStore.getState();
        setFullscreenPlayer(mode !== "fullscreen");
    });

    useEffect(followNativeFullscreen, []);

    return null;
}
