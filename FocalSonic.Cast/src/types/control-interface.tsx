export default interface ControlInterface {
    initialize(eventHandler: (event: ControlInterfacePacket) => void): Promise<void>;
}

export interface MediaSourceData {
    playbackInterface: string;
    credentials?: string;
    songId?: string;
}

export interface ControlInterfacePacket {
    type: string;
    data: any;
}