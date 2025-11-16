/* eslint-disable @typescript-eslint/no-explicit-any */
import type ControlInterface from "../types/control-interface";
import type { ControlInterfaceInitializeResult } from "../types/control-interface";

declare global {
    interface Window {
        cast: any;
        castInstance: any;
    }
}

const chromecastControlInterface: ControlInterface = {
    initialize(): Promise<ControlInterfaceInitializeResult> {
        return new Promise((resolve) => {
            window.castInstance = window.cast.framework.CastReceiverContext.getInstance();

            const receiverOptions = new window.cast.framework.CastReceiverOptions();
            receiverOptions.customNamespaces = {
                'urn:x-cast:com.samsidparty.focalsonic': window.cast.framework.messages.MessageType.JSON
            };

            window.castInstance.start();

            window.castInstance.context.addCustomMessageListener('urn:x-cast:com.samsidparty.focalsonic', (event: any) => {
                console.log('Received custom message:', event.data);
                resolve(event.data as unknown as ControlInterfaceInitializeResult);
            });
        });
    }
}

export default chromecastControlInterface;