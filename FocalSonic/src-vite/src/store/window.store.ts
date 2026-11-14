import { useAppStore } from "@/store/app.store";
import { usePlayerStore } from "@/store/player.store";
import { shallow } from "zustand/shallow";
import { createWithEqualityFn } from "zustand/traditional";

/**
 * How the app's window is presented. Fullscreen and the mini player are both ways of showing
 * the now playing drawer, so they're mutually exclusive and only last while the drawer is open.
 */
export type WindowMode = "normal" | "fullscreen" | "miniplayer";

/** Matches the `xxs` screen in tailwind.config.js and the compact block in index.css. */
const COMPACT_LAYOUT_QUERY = "(max-width: 780px)";

const bridge = () => window.igniteView?.commandBridge;

/** The mini player is a native window feature, so it needs the desktop app's bridge. */
export const hasMiniPlayerSupport = Boolean(bridge()?.enterMiniPlayer);

interface WindowStore {
    mode: WindowMode

    /** The viewport is at the compact breakpoint, which the mini player window always is. */
    isCompact: boolean
    isLandscape: boolean

    setMode: (mode: WindowMode) => void

    /** Fullscreen from the drawer: leaves the drawer open on the way out. */
    toggleFullscreen: () => void

    /**
     * Fullscreen the way F11 and the OS see it: entering opens the now playing drawer
     * fullscreen, and leaving closes the drawer altogether.
     */
    setFullscreenPlayer: (fullscreen: boolean) => void

    toggleMiniPlayer: () => void
}

export const useWindowStore = createWithEqualityFn<WindowStore>()(
    (set, get) => ({
        mode: "normal",
        ...readViewport(),

        setMode: (mode) => {
            const previous = get().mode;
            if (mode === previous) return;

            set({ mode });
            applyBodyClasses(mode);
            leaveNativeMode(previous);
            enterNativeMode(mode);

            if (mode !== "normal") {
                usePlayerStore.getState().actions.setMainDrawerState(true);
            }
        },

        toggleFullscreen: () => {
            get().setMode(get().mode === "fullscreen" ? "normal" : "fullscreen");
        },

        setFullscreenPlayer: (fullscreen) => {
            if (fullscreen) {
                get().setMode("fullscreen");
            }
            else {
                // Closing the drawer takes the window back to normal too, see below.
                usePlayerStore.getState().actions.closeDrawer();
            }
        },

        toggleMiniPlayer: () => {
            if (get().mode === "miniplayer") {
                get().setMode("normal");
                return;
            }

            // There's only room for one panel, and lyrics suit the small window best.
            useAppStore.getState().settings.setExtraBarContent("lyrics");
            get().setMode("miniplayer");
        },
    }),
    shallow,
);

export const useWindowMode = () =>
    useWindowStore((state) => ({
        mode: state.mode,
        isFullscreen: state.mode === "fullscreen",
        isMiniPlayer: state.mode === "miniplayer",
        toggleFullscreen: state.toggleFullscreen,
        setFullscreenPlayer: state.setFullscreenPlayer,
        toggleMiniPlayer: state.toggleMiniPlayer,
    }));

export const useWindowLayout = () =>
    useWindowStore((state) => ({
        isCompact: state.isCompact,
        isLandscape: state.isLandscape,
    }));

// Fullscreen and the mini player only exist on top of the drawer, so however it closes
// (its close button, clearing the queue, a state sync from C#) the window goes with it.
usePlayerStore.subscribe(
    (state) => state.playerState.mainDrawerState,
    (isOpen) => {
        if (!isOpen) useWindowStore.getState().setMode("normal");
    },
);

window.addEventListener("resize", () => {
    // A minimized window measures 0px, which would flip every breakpoint and back again.
    if (window.innerWidth <= 0 || window.innerHeight <= 0) return;

    const viewport = readViewport();
    const { isCompact, isLandscape } = useWindowStore.getState();

    if (viewport.isCompact !== isCompact || viewport.isLandscape !== isLandscape) {
        useWindowStore.setState(viewport);
    }
});

function readViewport() {
    return {
        isCompact: window.matchMedia(COMPACT_LAYOUT_QUERY).matches,
        isLandscape: window.innerWidth > window.innerHeight,
    };
}

/** The stylesheet keys its fullscreen and mini player rules off these. */
function applyBodyClasses(mode: WindowMode) {
    document.body.classList.toggle("fullscreen", mode === "fullscreen");
    document.body.classList.toggle("miniplayer", mode === "miniplayer");
}

function enterNativeMode(mode: WindowMode) {
    const commands = bridge();

    if (mode === "fullscreen") {
        if (commands?.enterFullScreen) commands.enterFullScreen();
        else requestDocumentFullscreen();
    }
    else if (mode === "miniplayer") {
        commands?.enterMiniPlayer?.();
    }
}

function leaveNativeMode(mode: WindowMode) {
    const commands = bridge();

    if (mode === "fullscreen") {
        if (commands?.exitFullScreen) commands.exitFullScreen();
        else if (getDocumentFullscreenElement()) exitDocumentFullscreen();
    }
    else if (mode === "miniplayer") {
        commands?.exitMiniPlayer?.();
    }
}

// The browser build has no bridge, so it falls back to the Fullscreen API, prefixed on Safari.

type WebkitDocument = Document & {
    webkitFullscreenElement?: Element | null
    webkitExitFullscreen?: () => Promise<void> | void
};

type WebkitElement = HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void
};

function getDocumentFullscreenElement() {
    return document.fullscreenElement ?? (document as WebkitDocument).webkitFullscreenElement ?? null;
}

function requestDocumentFullscreen() {
    const element = document.documentElement as WebkitElement;
    const request = element.requestFullscreen?.bind(element) ?? element.webkitRequestFullscreen?.bind(element);

    Promise.resolve(request?.()).catch(() => {
        // Refused (no user gesture, or not allowed in this frame), so the page isn't fullscreen.
        if (useWindowStore.getState().mode === "fullscreen") {
            useWindowStore.getState().setMode("normal");
        }
    });
}

function exitDocumentFullscreen() {
    const doc = document as WebkitDocument;
    const exit = doc.exitFullscreen?.bind(doc) ?? doc.webkitExitFullscreen?.bind(doc);

    Promise.resolve(exit?.()).catch(() => {});
}

/**
 * Keeps the store in step with fullscreen changes the app didn't make: the green traffic
 * light on macOS (through the bridge), and Escape in the browser build.
 * Returns a function that stops listening.
 */
export function followNativeFullscreen() {
    window.onNativeFullscreenChange = (fullscreen) => {
        useWindowStore.getState().setFullscreenPlayer(fullscreen);
    };

    const onDocumentFullscreenChange = () => {
        if (!getDocumentFullscreenElement() && useWindowStore.getState().mode === "fullscreen") {
            useWindowStore.getState().setMode("normal");
        }
    };

    document.addEventListener("fullscreenchange", onDocumentFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onDocumentFullscreenChange);

    return () => {
        delete window.onNativeFullscreenChange;
        document.removeEventListener("fullscreenchange", onDocumentFullscreenChange);
        document.removeEventListener("webkitfullscreenchange", onDocumentFullscreenChange);
    };
}
