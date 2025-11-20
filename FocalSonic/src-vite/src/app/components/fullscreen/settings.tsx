import { Button } from "@/app/components/ui/button";
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
import { useDynamicColors } from "@/store/player.store";
import { SlidersHorizontal } from "lucide-react";
import React, { ComponentPropsWithoutRef, ReactNode } from "react";
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
