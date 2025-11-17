/* eslint-disable @typescript-eslint/no-explicit-any */
import type ControlInterface from "../types/control-interface";
import type { ControlInterfacePacket, MediaSourceData } from "../types/control-interface";

declare global {
    interface Window {
        cast: any;
        castInstance: any;
        playerManager: any;
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

            window.castInstance.addEventListener(window.cast.framework.system.EventType.READY, () => {
                if (!castDebugLogger.debugOverlayElement_) {
                    castDebugLogger.setEnabled(true);
                }
                castDebugLogger.info("Lifecycle", "Receiver ready");
            });


            window.castInstance.addEventListener(window.cast.framework.system.EventType.SENDER_CONNECTED, () => {
                resolve();
                castDebugLogger.info("Lifecycle", "Sender connected");
            });

            window.castInstance.addEventListener(window.cast.framework.system.EventType.ERROR, () => {
                castDebugLogger.error("Lifecycle", "Error occurred");
                reject();
            });

            window.playerManager.setMessageInterceptor(window.cast.framework.messages.MessageType.LOAD, loadRequestData => {

                if (!loadRequestData.media.entity) {
                    // Copy the value from contentId for legacy reasons if needed
                    loadRequestData.media.entity = loadRequestData.media.contentId;
                }

                const packetData: MediaSourceData = {
                    playbackInterface: loadRequestData.media.contentType,
                    credentials: loadRequestData.media.customData?.credentials,
                    songId: loadRequestData.media.entity,
                };

                eventHandler({
                    type: "setSource",
                    data: packetData
                })
                
            });

            // Start the cast receiver
            const receiverOptions = new window.cast.framework.CastReceiverOptions();
            receiverOptions.customNamespaces = {
                'urn:x-cast:com.samsidparty.focalsonic': window.cast.framework.system.MessageType.JSON
            };
            window.castInstance.start(receiverOptions);
        });
    }
}

export default chromecastControlInterface;