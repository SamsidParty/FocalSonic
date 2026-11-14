import { engineName, isMacOs } from "react-device-detect";
import { isDev } from "./env";

export enum MouseButton {
    Left = 0,
    Middle = 1,
    Right = 2,
}

export const isChromeOrFirefox = ["Blink", "Gecko"].includes(engineName);

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
