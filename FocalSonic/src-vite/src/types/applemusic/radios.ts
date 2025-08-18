import removeUndefined from "@/utils/removeUndefined";
import { Radio } from "../responses/radios";
import { AppleMusicSong } from "./song";

export function convertAppleMusicRadioToSubsonic(radio: AppleMusicSong, parent: any | undefined): Radio {
    if (!radio) { return; }

    return removeUndefined({
        id: radio.id,
        streamUrl: radio.id,
        title: radio.attributes?.name || "Unknown",
        appleMusic: {
            data: radio,
            libraryID: radio.id,
            parent: parent
        }
    });
}
