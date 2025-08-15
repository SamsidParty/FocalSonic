import { SubsonicResponse } from "@/types/responses/subsonicResponse";

async function pingInfo() {
    return {
        openSubsonic: true,
        serverVersion: "1.0.0",
        status: "ok",
        type: "applemusic",
        version: "1.16.1",
    } as SubsonicResponse;
}

async function pingView() {
    return true;
}

export const ping = {
    pingInfo,
    pingView,
};
