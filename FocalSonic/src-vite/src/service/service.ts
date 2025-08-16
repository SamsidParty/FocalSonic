import { checkServerType } from "@/utils/servers";
import { appleMusic } from "./applemusic";
import { subsonic } from "./subsonic";

export const service = new Proxy({}, {
    get(target, prop, receiver) {
        const { isAppleMusic } = checkServerType();

        if (isAppleMusic) {
            return appleMusic[prop as keyof typeof appleMusic];
        }

        return subsonic[prop as keyof typeof subsonic];
    }
});
