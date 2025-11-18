import { engineName, isMacOs } from "react-device-detect";
import { isDev } from "./env";

export enum MouseButton {
    Left = 0,
    Middle = 1,
    Right = 2,
}

export const isChromeOrFirefox = ["Blink", "Gecko"].includes(engineName);

// Enable only if enterMiniPlayer is defined
export const hasPiPSupport = (window.igniteView && window.igniteView.commandBridge?.enterMiniPlayer);

function preventContextMenu() {
    document.addEventListener("contextmenu", (e) => {
        if (
            e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement
        ) {
            return;
        }

        e.preventDefault();
    });
}

function isAnyModifierKeyPressed(e: MouseEvent) {
    return e.ctrlKey || e.metaKey || e.shiftKey || e.altKey;
}

function preventNewTabAndScroll() {
    // Prevent new tab on middle click
    document.addEventListener("auxclick", (e) => {
        e.preventDefault();
    });

    // Prevent scroll circle and new tab
    document.addEventListener("mousedown", (e) => {
        if (e.button === MouseButton.Middle || isAnyModifierKeyPressed(e)) {
            e.preventDefault();
        }
    });

    // Prevent new tab if clicking with special key
    document.addEventListener("click", (e) => {
        if (isAnyModifierKeyPressed(e)) {
            e.preventDefault();
        }
    });
}


function preventAltBehaviour() {
    document.addEventListener("keydown", (e) => {
        if (e.altKey) {
            e.preventDefault();
        }
    });
}

export function isFullscreen() {
    return document.body.classList.contains("fullscreen");
}

export function enterFullscreen() {
    document.body.classList.add("fullscreen");
    if (window.igniteView?.commandBridge?.enterFullScreen) {
        window.igniteView.commandBridge.enterFullScreen();
        return;
    }

    const element = document.documentElement;
    if (element.requestFullscreen) {
        element.requestFullscreen();
    }
    if ("webkitRequestFullscreen" in element) {
    // @ts-expect-error no types for webkit
        element.webkitRequestFullscreen();
    }
}

export function exitFullscreen() {

    document.body.classList.remove("fullscreen");
    if (window.igniteView?.commandBridge?.exitFullScreen) {
        window.igniteView.commandBridge.exitFullScreen();
        return;
    }

    if (document.exitFullscreen) {
        document.exitFullscreen();
    }
    if ("webkitExitFullscreen" in document) {
    // @ts-expect-error no types for webkit
        document.webkitExitFullscreen();
    }
}

function setFontSmoothing() {
    if (isMacOs) {
        document.body.classList.add("mac");
    } else {
        document.body.classList.add("windows-linux");
    }
}

export function blockFeatures() {
    setFontSmoothing();

    if (isDev) return;

    preventContextMenu();
    preventNewTabAndScroll();
    preventAltBehaviour();
}
