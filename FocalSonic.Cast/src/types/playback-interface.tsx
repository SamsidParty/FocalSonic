import type { ControlInterfaceInitializeResult } from "./control-interface";

export default interface PlaybackInterface {
    initialize(initData: ControlInterfaceInitializeResult): Promise<void>;
}