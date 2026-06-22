import { useAppRuntimeState, useAppStore } from "@/store/app.store";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import { DropdownSettingOptions, DropdownSettingWrapper } from "../ui/dropdown-settings";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

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
    const { altLyricsMode, setAltLyricsMode } = useAppStore().settings;
    const lyricModes = ["off", "transliteration", "translation"];

    return (
        <DropdownSettingWrapper
            text={t("settings.appearance.player.alternateLyric")}
            {...props}
        >
            <Select value={altLyricsMode} onValueChange={(mode) => setAltLyricsMode(mode)}>
                <SelectTrigger className="h-8 ring-offset-transparent focus:ring-0">
                    <SelectValue>
                        <span className="ml-1">{t("settings.audio.lyrics.altLyric." + altLyricsMode)}</span>
                    </SelectValue>
                </SelectTrigger>
                <SelectContent align="end">
                    <SelectGroup>
                        {
                            lyricModes.map((mode) => (
                                <SelectItem
                                    key={mode}
                                    value={mode}
                                >
                                    <span className="ml-1">{t("settings.audio.lyrics.altLyric." + mode)}</span>
                                </SelectItem>
                            ))
                        }
                    </SelectGroup>
                </SelectContent>
            </Select>
        </DropdownSettingWrapper>
    );
}