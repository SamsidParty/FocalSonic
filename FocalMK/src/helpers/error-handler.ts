export default function handleError(error: Error | string, throwError?: boolean) {
    const errorMessage = error?.reason?.reason || error?.reason || error.toString();

    console.error("[FocalMK] Fatal error occured: ", errorMessage);

    // Show message box if in igniteView
    if (window.igniteView?.commandBridge?.displayError) {
        window.igniteView.commandBridge.displayError("Something went wrong with audio playback", errorMessage);
    }

    if (throwError) {
        throw new Error(errorMessage);
    }
}