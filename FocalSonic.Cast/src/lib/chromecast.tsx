/* eslint-disable @typescript-eslint/no-explicit-any */
import type ControlInterface from "../types/control-interface";
import type { ControlInterfacePacket } from "../types/control-interface";

declare global {
    interface Window {
        cast: any;
        castInstance: any;
        playerManager: any;
        assignAudioElement?: (element: HTMLMediaElement) => void;
    }
}

const focalsonicNamespace = 'urn:x-cast:com.samsidparty.focalsonic';



const chromecastControlInterface: ControlInterface = {
    initialize(eventHandler: (event: ControlInterfacePacket) => void): Promise<void> {
        return new Promise((resolve, reject) => {

            if (window.castInstance) return;

            window.castInstance = window.cast.framework.CastReceiverContext.getInstance();
            window.playerManager = window.castInstance.getPlayerManager();

            const castDebugLogger = window.cast.debug.CastDebugLogger.getInstance();
            window.castDebugLogger = castDebugLogger;


            window.castInstance.addEventListener(window.cast.framework.system.EventType.READY, () => {
                if (!castDebugLogger.debugOverlayElement_) {
                    castDebugLogger.setEnabled(true);
                }
                castDebugLogger.info("Lifecycle", "Receiver ready");
            });


            window.castInstance.addEventListener(window.cast.framework.system.EventType.SENDER_CONNECTED, () => {
                castDebugLogger.info("Lifecycle", "Sender connected");
                window.castInstance.sendCustomMessage(focalsonicNamespace, null, { type: "init" });
            });

            window.castInstance.addEventListener(window.cast.framework.system.EventType.ERROR, () => {
                castDebugLogger.error("Lifecycle", "Error occurred");
                reject();
            });

            window.playerManager.setMessageInterceptor(window.cast.framework.messages.MessageType.LOAD, loadRequestData => {

                if (loadRequestData.media.contentType == "focalsonic/virtual-cast-message") {
                    resolve();
                    const message = JSON.parse(loadRequestData.media.contentId) as ControlInterfacePacket;
                    eventHandler(message);
                }

                return null; // Prevent default load handling
            });

            
            const receiverOptions = new window.cast.framework.CastReceiverOptions();
            receiverOptions.customNamespaces = {};
            receiverOptions.customNamespaces[focalsonicNamespace] = window.cast.framework.system.MessageType.JSON;

            // Start the cast receiver
            window.castInstance.start(receiverOptions);
        });
    }
}

export default chromecastControlInterface;