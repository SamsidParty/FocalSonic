import { Button } from "@/app/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Slider } from "@/app/components/ui/slider";
import { Switch } from "@/app/components/ui/switch";
import { usePersongOverrides } from "@/store/persong.store";
import { useDynamicColors } from "@/store/player.store";
import { t } from "i18next";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LyricSettings } from "../lyrics/lyric-settings";
import { DropdownSettingOptions, DropdownSettingsPopover, DropdownSettingWrapper } from "../ui/dropdown-settings";

export function FullscreenSettings(props) {
    return (
        <QueueSettings {...props} />
    );
}

export function QueueSettings() {
    const { useDynamicColorsOnQueue } = useDynamicColors();

    return (
        <DropdownSettingsPopover>
            <>
                <QueueDynamicColorOption showSeparator={false} />
                {!useDynamicColorsOnQueue && <ColorIntensityOption showSeparator={false} />}
                <CustomBackgroundOption />
                <LyricSettings />
            </>
        </DropdownSettingsPopover>
    );
}



function QueueDynamicColorOption(props: DropdownSettingOptions) {
    const { t } = useTranslation();
    const { useDynamicColorsOnQueue, setuseDynamicColorsOnQueue } = useDynamicColors();

    return (
        <DropdownSettingWrapper text={t("settings.appearance.colors.group")} {...props}>
            <Switch
                checked={useDynamicColorsOnQueue}
                onCheckedChange={() => setuseDynamicColorsOnQueue(!useDynamicColorsOnQueue)}
            />
        </DropdownSettingWrapper>
    );
}

function ColorIntensityOption(props: DropdownSettingOptions) {
    const { t } = useTranslation();
    const { currentSongColorIntensity, setCurrentSongIntensity } = useDynamicColors();

    const intensityTooltip = `${Math.round(currentSongColorIntensity * 100)}%`;

    return (
        <DropdownSettingWrapper
            text={t("settings.appearance.colors.queue.intensity")}
            {...props}
        >
            <Slider
                defaultValue={[currentSongColorIntensity]}
                min={0}
                max={1.0}
                step={0.05}
                tooltipValue={intensityTooltip}
                onValueChange={([value]) => setCurrentSongIntensity(value)}
            />
        </DropdownSettingWrapper>
    );
}

function CustomBackgroundOption() {
    const { data, setVideoBackgroundURL, clearCustomBackground } = usePersongOverrides();
    const [open, setOpen] = useState(false);
    const [url, setUrl] = useState<string>(data.videoBackgroundURL ?? "");

    useEffect(() => {
        if (open) setUrl(data.videoBackgroundURL ?? "");
    }, [open, data.videoBackgroundURL]);

    return (
        <DropdownSettingWrapper showSeparator={false} text={t("fullscreen.customBackground")}>
            <>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                            {data.videoBackgroundURL ? <Pencil className="size-4" /> : <Plus className="size-4" /> }     
                        </Button>
                            
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t("fullscreen.customBackground")}</DialogTitle>
                            <DialogDescription>{t("fullscreen.customBackgroundDescription")}</DialogDescription>
                        </DialogHeader>
                        <div className="pt-2">
                            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/video.mp4" />
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                            </DialogClose>
                            <DialogClose asChild>
                                <Button onClick={() => { setVideoBackgroundURL(url); }}>Apply</Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </>

            {data.videoBackgroundURL && (
                <>
                    <Button className="ml-2" variant="ghost" size="sm" onClick={() => clearCustomBackground()}>
                        <Trash2 className="size-4" />
                    </Button>
                </>
            )}
        </DropdownSettingWrapper>
    );
}


