import { MainDrawerPage } from "@/app/components/drawer/page";
import { Player } from "@/app/components/player/player";
import { RemovePlaylistDialog } from "@/app/components/playlist/remove-dialog";
import { SongInfoDialog } from "@/app/components/song/info-dialog";
import { Header } from "@/app/layout/header";
import { Sidebar } from "@/app/layout/sidebar";
import { memo, useState } from "react";
import { MainRoutes } from "./main";

const MemoHeader = memo(Header);
const MemoSidebar = memo(Sidebar);
const MemoPlayer = memo(Player);
const MemoSongInfoDialog = memo(SongInfoDialog);
const MemoRemovePlaylistDialog = memo(RemovePlaylistDialog);
const MemoMainDrawerPage = memo(MainDrawerPage);

export default function BaseLayout() {

    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="h-screen w-screen overflow-hidden">
            <MemoHeader/>
            <MemoSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <MemoPlayer />
            {/* Routes */}
            <MainRoutes sidebarOpen={sidebarOpen} />
            <MemoSongInfoDialog />
            <MemoRemovePlaylistDialog />
            <MemoMainDrawerPage />
        </div>
    );
}
