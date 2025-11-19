import type { ControlInterfacePacket } from "./control-interface";

export default interface PlaybackInterface {
    handleEvent(event: ControlInterfacePacket): Promise<void>;
}