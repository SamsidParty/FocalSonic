import { useMainDrawerState } from "@/store/player.store";
import { LyricsTab } from "../fullscreen/lyrics";
import { LyricSettings } from "../lyrics/lyric-settings";
import { DropdownSettingsPopover } from "../ui/dropdown-settings";

export default function ExtrabarLyrics() {

    const { mainDrawerState } = useMainDrawerState();

    return (
        <div className="w-full h-full flex flex-col">
            <ExtrabarLyricSettings className="absolute right-4 top-2 z-10" />
            <LyricsTab small visible={!mainDrawerState} leftAlign />
        </div>
    );
}

function ExtrabarLyricSettings(props: { className?: string }) {
    return (
        <DropdownSettingsPopover className={props.className}>
            <>
                <LyricSettings />
            </>
        </DropdownSettingsPopover>
    );
}