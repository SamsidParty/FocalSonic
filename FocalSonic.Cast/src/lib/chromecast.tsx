/* eslint-disable @typescript-eslint/no-explicit-any */
import type ControlInterface from "../types/control-interface";
import type { ControlInterfacePacket, MediaSourceData } from "../types/control-interface";

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

            window.playerManager.setMediaElement(new Promise<HTMLMediaElement>((res) => {
                window.assignAudioElement = res;
            }));

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

                const contentType = loadRequestData.media.contentType;
                // Split by first colon to separate playback interface and credential
                // The credential can include colons, so only split by the first one
                const [playbackInterface, ...credentialParts] = contentType.split(":");
                const credentials = credentialParts.join(":") || undefined;

                const packetData: MediaSourceData = {
                    playbackInterface: playbackInterface,
                    credentials: credentials,
                    songId: loadRequestData.media.entity,
                };

                eventHandler({
                    type: "setSource",
                    data: packetData
                });

                window.playerManager.broadcastStatus(true);

                return null; // Prevent default load handling
            });

            
            window.playerManager.setMessageInterceptor(window.cast.framework.messages.MessageType.PAUSE, () => {
                alert("pause");
            });

            window.playerManager.setMessageInterceptor(window.cast.framework.messages.MessageType.PLAY, () => {
                alert("play");
            });

            // Start the cast receiver
            window.castInstance.start();
        });
    }
}

export default chromecastControlInterface;