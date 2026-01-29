import { Button } from "@/app/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/app/components/ui/popover";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Separator } from "@/app/components/ui/separator";
import { Slider } from "@/app/components/ui/slider";
import { Switch } from "@/app/components/ui/switch";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app.store";
import { usePersongOverrides } from "@/store/persong.store";
import { useDynamicColors } from "@/store/player.store";
import { t } from "i18next";
import { Pencil, Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import React, { ComponentPropsWithoutRef, ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function FullscreenSettings(props) {
    return (
        <QueueSettings {...props} />
    );
}

export function QueueSettings() {
    const { useDynamicColorsOnQueue } = useDynamicColors();

    return (
        <DynamicSettingsPopover>
            <>
                <QueueDynamicColorOption showSeparator={false} />
                {!useDynamicColorsOnQueue && <ColorIntensityOption showSeparator={false} />}
                <CustomBackgroundOption />
                <AlternateLyricOption />
            </>
        </DynamicSettingsPopover>
    );
}

interface PopoverProps {
    children: ReactNode
}

function DynamicSettingsPopover({ children }: PopoverProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    data-webview-ignore={""}
                    variant="ghost"
                    size="icon"
                    className="size-10 mr-auto rounded-full hover:bg-foreground/20 data-[state=open]:bg-foreground/20"
                >
                    <SlidersHorizontal className="size-4" strokeWidth={2.5} />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
                <div className="flex flex-col">{children}</div>
            </PopoverContent>
        </Popover>
    );
}

type OptionProps = Omit<ComponentPropsWithoutRef<typeof SettingWrapper>, "text">


function QueueDynamicColorOption(props: OptionProps) {
    const { t } = useTranslation();
    const { useDynamicColorsOnQueue, setuseDynamicColorsOnQueue } = useDynamicColors();

    return (
        <SettingWrapper text={t("settings.appearance.colors.group")} {...props}>
            <Switch
                checked={useDynamicColorsOnQueue}
                onCheckedChange={() => setuseDynamicColorsOnQueue(!useDynamicColorsOnQueue)}
            />
        </SettingWrapper>
    );
}

function ColorIntensityOption(props: OptionProps) {
    const { t } = useTranslation();
    const { currentSongColorIntensity, setCurrentSongIntensity } = useDynamicColors();

    const intensityTooltip = `${Math.round(currentSongColorIntensity * 100)}%`;

    return (
        <SettingWrapper
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
        </SettingWrapper>
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
        <SettingWrapper showSeparator={false} text={t("fullscreen.customBackground")}>
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
        </SettingWrapper>
    );
}

function AlternateLyricOption(props: OptionProps) {
    const { t } = useTranslation();
    const { altLyricsMode, setAltLyricsMode } = useAppStore().settings;
    const lyricModes = ["off", "transliteration", "translation"];

    return (
        <SettingWrapper
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
        </SettingWrapper>
    );
}

type SettingWrapperProps = ComponentPropsWithoutRef<"div"> & {
    text: string
    showSeparator?: boolean
}

function SettingWrapper({
    text,
    className,
    children,
    showSeparator = true,
    ...props
}: SettingWrapperProps) {
    return (
        <>
            {showSeparator && <Separator />}
            <div
                className={cn("flex items-center justify-between p-3", className)}
                {...props}
            >
                <span className="text-sm flex-1 text-balance">{text}</span>
                <div className="w-1/2 flex items-center justify-end">{children}</div>
            </div>
        </>
    );
}
