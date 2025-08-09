import { type } from "@tauri-apps/plugin-os";
import { isSafari as isSafariBrowser } from "react-device-detect";

export function getOsType() {
    return Promise.resolve(type());
}

export const isWindows = window.igniteView?.platformHints?.includes("windows");
export const isMac = window.igniteView?.platformHints?.includes("macos");
export const isLinux = window.igniteView?.platformHints?.includes("linux");

export const isSafari = isMac || isSafariBrowser;
