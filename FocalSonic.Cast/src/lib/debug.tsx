import type ControlInterface from "../types/control-interface";
import type { ControlInterfacePacket } from "../types/control-interface";

const debugControlInterface: ControlInterface = {
    initialize(eventHandler: (event: ControlInterfacePacket) => void): Promise<void> {
        return new Promise((resolve) => {
            console.log("Debug control interface initialized");

            eventHandler({ type: "setCredentials", data: ["applemusic", ""] });
            eventHandler({ type: "setSource", data: ["1679278167"] });

            resolve();
        });
    }
}

export default debugControlInterface;