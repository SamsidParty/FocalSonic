import { ROUTES } from "@/routes/routesList";
import { subsonic } from "@/service/subsonic";
import { useAppStore } from "@/store/app.store";
import { redirect } from "react-router-dom";

export async function protectedLoader() {
    const { url, password, isServerConfigured, serverType } = useAppStore.getState().data;
    const hasNoUrl = !url || url === "";
    const hasNoToken = !password || password === "";

    if (serverType === "applemusic" && localStorage.applemusic_proxy_username) {
        const loadState = await window.igniteView?.commandBridge.waitUntilAppleMusicLoads();
        if (loadState !== "success") {
            return redirect(ROUTES.SERVER_CONFIG);
        }
    }
    else {
        if (hasNoUrl || hasNoToken || !isServerConfigured)
            return redirect(ROUTES.SERVER_CONFIG);

        const isServerUp = await subsonic.ping.pingView();
        if (!isServerUp) return redirect(ROUTES.SERVER_CONFIG);
    }


    return null;
}

export async function podcastsLoader() {
    const { active } = useAppStore.getState().podcasts;

    if (!active) {
        return redirect(ROUTES.LIBRARY.HOME);
    }

    return null;
}
