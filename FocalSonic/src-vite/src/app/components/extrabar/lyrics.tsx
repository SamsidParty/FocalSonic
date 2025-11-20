import { useMainDrawerState } from "@/store/player.store";
import { LyricsTab } from "../fullscreen/lyrics";

export default function ExtrabarLyrics() {

    const { mainDrawerState } = useMainDrawerState();

    return (
        <>
            <LyricsTab small visible={!mainDrawerState} leftAlign />
        </>
    );
}