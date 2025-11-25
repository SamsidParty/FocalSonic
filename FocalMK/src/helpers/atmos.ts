declare global {
    interface Window {
        enableAtmos?: boolean;  
    }
}

export function isAtmosSupported() {
    // Check for ec-3 codec support
    const audio = document.createElement("audio");
    const isEc3Supported = audio.canPlayType('audio/mp4; codecs="ec-3"') !== "";
    return isEc3Supported;
}


export function isAtmosEnabled() {
    return window.enableAtmos === true && isAtmosSupported();
}