import { cn } from "@/lib/utils";
import { useAppRuntimeState, useAppStore } from "@/store/app.store";
import { usePlayerSonglist } from "@/store/player.store";
import { LyricChannel } from "@/types/serverConfig";
import { canTranslate, canTransliterate } from "@/utils/lyricEligibility";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import { DropdownSettingOptions, DropdownSettingWrapper } from "../ui/dropdown-settings";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "../ui/dropdown-menu";

// Order matches how the channels stack: original first, then the two alternates.
const LYRIC_CHANNELS: LyricChannel[] = ["original", "transliteration", "translation"];

export function LyricSettings() {
    return (
        <>
            <AlternateLyricOption />
            <GetMoreLyricsOption />
        </>
    );
}

function GetMoreLyricsOption(props: DropdownSettingOptions) {
    const { t } = useTranslation();
    const { setLyricsFinderDialogState } = useAppRuntimeState();

    return (
        <DropdownSettingWrapper text={t("lyricsFinder.getMore")} {...props}>
            <Button variant="ghost" size="sm" onClick={() => setLyricsFinderDialogState(true)}>
                <Search className="size-4" />
            </Button>
        </DropdownSettingWrapper>
    );
}

function AlternateLyricOption(props: DropdownSettingOptions) {
    const { t } = useTranslation();
    const { altLyricChannels, setAltLyricChannels } = useAppStore().settings;
    const { currentSong } = usePlayerSonglist();
    const { artist, title, duration } = currentSong;

    // Read the already-fetched lyrics from the shared cache (populated by the
    // lyrics view) purely to decide eligibility - never trigger a fetch here.
    const { data: lyrics } = useQuery<string | undefined>({
        queryKey: ["get-lyrics", artist, title, duration],
        enabled: false,
    });

    // Ineligible channels are only *visually* greyed; they stay toggleable so the
    // user can force them on ("not applicable for this song, but you can still change it").
    const eligibility: Record<LyricChannel, boolean> = {
        original: true,
        transliteration: canTransliterate(lyrics),
        translation: canTranslate(lyrics),
    };

    const toggleChannel = (channel: LyricChannel) => {
        if (altLyricChannels.includes(channel)) {
            // Deselecting the last remaining channel reverts to original only.
            const next = altLyricChannels.filter((c) => c !== channel);
            setAltLyricChannels(next);
        } else {
            // Append so slot priority follows selection order.
            setAltLyricChannels([...altLyricChannels, channel]);
        }
    };

    const summary = altLyricChannels
        .map((channel) => t("settings.audio.lyrics.altLyric." + channel))
        .join(", ");

    return (
        <DropdownSettingWrapper text={t("settings.appearance.player.alternateLyric")} {...props}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 max-w-full justify-end ring-offset-transparent focus:ring-0">
                        <span className="ml-1 truncate">{summary}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {LYRIC_CHANNELS.map((channel) => (
                        <DropdownMenuCheckboxItem
                            key={channel}
                            checked={altLyricChannels.includes(channel)}
                            onCheckedChange={() => toggleChannel(channel)}
                            onSelect={(e) => e.preventDefault()}
                            className={cn(!eligibility[channel] && "opacity-40")}
                        >
                            {t("settings.audio.lyrics.altLyric." + channel)}
                        </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </DropdownSettingWrapper>
    );
}
