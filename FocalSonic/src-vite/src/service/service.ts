import { checkServerType } from "@/utils/servers";
import { appleMusic } from "./applemusic";

export const service = new Proxy({}, {
    get(target, prop, receiver) {
        const { isAppleMusic } = checkServerType();

        if (isAppleMusic) {
            return appleMusic[prop as keyof typeof appleMusic];
        }

        return service[prop as keyof typeof service];
    }
});
