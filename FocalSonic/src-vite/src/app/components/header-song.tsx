import { usePlayerSonglist } from "@/store/player.store";
import { igniteViewDragRegion } from "@/utils/igniteViewDragRegion";
import { AppTitle } from "./header/app-title";

export function HeaderSongInfo() {
    const { currentList, currentSongIndex, currentSong } = usePlayerSonglist();

    const isPlaylistEmpty = currentList.length === 0;
    
    return (
        <div
            {...igniteViewDragRegion}
            className="col-span-2 w-full flex justify-center items-center"
        >
            {isPlaylistEmpty && <AppTitle />}
            {!isPlaylistEmpty && (
                <div
                    {...igniteViewDragRegion}
                    className="flex w-full justify-center subpixel-antialiased font-medium text-sm text-muted-foreground"
                >
                    <p {...igniteViewDragRegion} className="leading-7 truncate">
                        {currentSong.title}
                    </p>
                </div>
            )}
        </div>
    );
}
