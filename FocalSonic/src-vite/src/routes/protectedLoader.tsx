import { ROUTES } from "@/routes/routesList";
import { service } from "@/service/service";
import { useAppStore, waitForAppHydration } from "@/store/app.store";
import { redirect } from "react-router-dom";

export async function protectedLoader() {

    await waitForAppHydration();
    const { url, password, isServerConfigured, serverType } = useAppStore.getState().data;
    const hasNoUrl = !url || url === "";
    const hasNoToken = !password || password === "";

    if (serverType === "applemusic") {
        const loadState = await window.igniteView?.commandBridge.waitUntilAppleMusicLoads();
        if (loadState !== "success") {
            return redirect(ROUTES.SERVER_CONFIG);
        }
    }
    else {
        if (hasNoUrl || hasNoToken || !isServerConfigured)
            return redirect(ROUTES.SERVER_CONFIG);

        const isServerUp = await service.ping.pingView();
        if (!isServerUp) return redirect(ROUTES.SERVER_CONFIG);
    }


    return null;
}
