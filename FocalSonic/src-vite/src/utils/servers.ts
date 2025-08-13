import { useAppStore } from "@/store/app.store";

export function checkServerType() {
    const { serverType } = useAppStore.getState().data;

    const isSubsonic = serverType === "subsonic";
    const isNavidrome = serverType === "navidrome";
    const isLms = serverType === "lms";
    const isAppleMusic = serverType === "applemusic";

    return {
        isSubsonic,
        isNavidrome,
        isLms,
        isAppleMusic
    };
}
