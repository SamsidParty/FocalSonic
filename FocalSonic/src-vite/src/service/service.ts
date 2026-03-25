import { checkServerType } from "@/utils/servers";
import { appleMusic } from "./applemusic";
import { subsonic } from "./subsonic";

type ServiceMap = typeof subsonic & typeof appleMusic;

export const service = new Proxy({} as ServiceMap, {
    get(_target, prop: keyof ServiceMap) {
        const { isAppleMusic } = checkServerType();

        if (isAppleMusic) {
            return appleMusic[prop as keyof typeof appleMusic];
        }

        return subsonic[prop as keyof typeof subsonic];
    },
});
