import { SettingsDialog } from "@/app/components/settings/dialog";
import { LangObserver } from "@/app/observers/lang-observer";
import { MediaSessionObserver } from "@/app/observers/media-session-observer";
import { ThemeObserver } from "@/app/observers/theme-observer";
import { ToastContainer } from "@/app/observers/toast-container";
import { UpdateObserver } from "@/app/observers/update-observer";
import { Mobile } from "@/app/pages/mobile";
import { router } from "@/routes/router";
import { isTauri } from "@/utils/tauriTools";
import { isDesktop } from "react-device-detect";
import { RouterProvider } from "react-router-dom";
import AppleMusicLoader from "./app/components/fallbacks/apple-music-loader";
import DefaultTitlebar from "./app/components/header/default-titlebar";
import { useAppStore } from "./store/app.store";

function App() {
    if (!isDesktop && window.innerHeight > window.innerWidth) return <Mobile />; // Support tablets but not phones

    return (
        <>
            {isTauri() && <UpdateObserver />}
            <MediaSessionObserver />
            <LangObserver />
            <ThemeObserver />
            <SettingsDialog />
            <RouterProvider fallbackElement={<Loader />} router={router} />
            <ToastContainer />
        </>
    );
}

function Loader() {

    const { serverType } = useAppStore.getState().data;

    return (
        <div className="flex flex-col w-screen h-screen">
            <DefaultTitlebar />
            <main className="flex flex-col w-full h-full justify-center items-center bg-body">
                {
                    serverType === "applemusic" && <AppleMusicLoader/>
                }
            </main>
        </div>
    )
}

export default App;
