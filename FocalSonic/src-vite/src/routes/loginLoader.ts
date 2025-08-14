import { ROUTES } from "@/routes/routesList";
import { service } from "@/service/service";
import { useAppStore } from "@/store/app.store";
import { redirect } from "react-router-dom";

export async function loginLoader() {
    const { url, username, password, isServerConfigured } =
    useAppStore.getState().data;

    const hasUrl = url || url !== "";
    const hasPassword = password || password !== "";
    const hasUser = username || username !== "";

    if (hasUrl && hasPassword && hasUser && isServerConfigured) {
        const isServerUp = await service.ping.pingView();
        if (isServerUp) return redirect(ROUTES.LIBRARY.HOME);
    }

    return null;
}
