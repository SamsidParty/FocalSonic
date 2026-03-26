import { MainDrawerPage } from "@/app/components/drawer/page";
import { Player } from "@/app/components/player/player";
import { RemovePlaylistDialog } from "@/app/components/playlist/remove-dialog";
import { SongInfoDialog } from "@/app/components/song/info-dialog";
import { Header } from "@/app/layout/header";
import { Sidebar } from "@/app/layout/sidebar";
import { Extrabar } from "./extrabar";
import { MainRoutes } from "./main";

export default function BaseLayout() {
    return (
        <div className="h-screen w-screen overflow-hidden">
            <Header />
            <Sidebar />
            <Extrabar />
            <Player />
            {/* Routes */}
            <MainRoutes />
            <SongInfoDialog />
            <RemovePlaylistDialog />
            <MainDrawerPage />
        </div>
    );
}
