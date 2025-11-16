export default interface ControlInterface {
    initialize(): Promise<ControlInterfaceInitializeResult>;
}

export interface ControlInterfaceInitializeResult {
    playbackInterfaceName: string;
    playbackInterfaceToken: string;
}