export default interface ControlInterface {
    initialize(eventHandler: (event: ControlInterfacePacket) => void): Promise<void>;
}


export interface ControlInterfacePacket {
    type: string;
    data: string[];
}