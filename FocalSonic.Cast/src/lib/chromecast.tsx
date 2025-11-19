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


            window.castInstance.addEventListener(window.cast.framework.system.EventType.READY, () => {
                console.log("Ready");
            });


            window.castInstance.addEventListener(window.cast.framework.system.EventType.SENDER_CONNECTED, () => {
                console.log("Connected to sender")
            });

            window.castInstance.addEventListener(window.cast.framework.system.EventType.SENDER_DISCONNECTED, () => {
                console.log("Disconnected from sender")

                // 1 second delay to allow for quick reconnections
                setTimeout(() => {
                    if (window.castInstance.getSenders().length < 1) {
                        console.log("No senders connected, stopping receiver");
                        window.close();
                        window.castInstance.stop();
                    }
                }, 1000);
            });

            window.castInstance.addEventListener(window.cast.framework.system.EventType.ERROR, () => {
                console.log("Error occurred within cast SDK")
                reject();
            });

            window.playerManager.setMessageInterceptor(window.cast.framework.messages.MessageType.LOAD, loadRequestData => {

                if (loadRequestData.media.contentType == "focalsonic/virtual-cast-message") {
                    resolve();
                    const message = JSON.parse(loadRequestData.media.contentId) as ControlInterfacePacket;
                    eventHandler(message);
                }

                const responsePacket: ControlInterfacePacket = {
                    type: "ok",
                    data: [
                        window.currentStatus?.metadata?.mediaId || "no-media",
                        (window.currentStatus?.metadata?.timeSync || Date.now()).toString(),
                        (window.currentStatus?.metadata?.currentTime || 0).toString()
                    ]
                };

                return {
                    media: {
                        contentType: "focalsonic/virtual-response",
                        contentId: JSON.stringify(responsePacket),
                    }
                }
            });

            
            const receiverOptions = new window.cast.framework.CastReceiverOptions();
            receiverOptions.disableIdleTimeout = true;
            receiverOptions.customNamespaces = {};
            receiverOptions.customNamespaces[focalsonicNamespace] = window.cast.framework.system.MessageType.JSON;

            // Start the cast receiver
            window.castInstance.start(receiverOptions);
        });
    }
}

export default chromecastControlInterface;