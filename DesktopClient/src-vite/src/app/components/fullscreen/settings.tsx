import { Button } from "@/app/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { Separator } from "@/app/components/ui/separator";
import { Slider } from "@/app/components/ui/slider";
import { Switch } from "@/app/components/ui/switch";
import { cn } from "@/lib/utils";
import { useDynamicColors } from "@/store/player.store";
import { SlidersHorizontal } from "lucide-react";
import { ComponentPropsWithoutRef, ReactNode } from "react";
import { useTranslation } from "react-i18next";

export function FullscreenSettings() {
    const { useDynamicColorsOnBigPlayer } = useDynamicColors();

    return (
        <DynamicSettingsPopover>
            <>
                <DynamicColorOption showSeparator={false} />
                {useDynamicColorsOnBigPlayer && <ColorIntensityOption />}
                {!useDynamicColorsOnBigPlayer && <ImageBlurSizeOption />}
            </>
        </DynamicSettingsPopover>
    );
}

export function QueueSettings() {
    const { useDynamicColorsOnQueue } = useDynamicColors();

    return (
        <DynamicSettingsPopover>
            <>
                <QueueDynamicColorOption showSeparator={false} />
                {!useDynamicColorsOnQueue && <ColorIntensityOption />}
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
                    variant="ghost"
                    size="icon"
                    className="size-10 rounded-full hover:bg-foreground/20 data-[state=open]:bg-foreground/20"
                >
                    <SlidersHorizontal className="size-4" strokeWidth={2.5} />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex flex-col">{children}</div>
            </PopoverContent>
        </Popover>
    );
}

type OptionProps = Omit<ComponentPropsWithoutRef<typeof SettingWrapper>, "text">

function DynamicColorOption(props: OptionProps) {
    const { t } = useTranslation();
    const { useDynamicColorsOnBigPlayer, setuseDynamicColorsOnBigPlayer } = useDynamicColors();

    return (
        <SettingWrapper text={t("settings.appearance.colors.group")} {...props}>
            <Switch
                checked={useDynamicColorsOnBigPlayer}
                onCheckedChange={() =>
                    setuseDynamicColorsOnBigPlayer(!useDynamicColorsOnBigPlayer)
                }
            />
        </SettingWrapper>
    );
}

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
                min={0.3}
                max={1.0}
                step={0.05}
                tooltipValue={intensityTooltip}
                onValueChange={([value]) => setCurrentSongIntensity(value)}
            />
        </SettingWrapper>
    );
}

function ImageBlurSizeOption(props: OptionProps) {
    const { t } = useTranslation();
    const { bigPlayerBlur, setBigPlayerBlurValue } = useDynamicColors();

    return (
        <SettingWrapper
            text={t("settings.appearance.colors.bigPlayer.blurSize")}
            {...props}
        >
            <Slider
                defaultValue={[bigPlayerBlur.value]}
                min={bigPlayerBlur.settings.min}
                max={bigPlayerBlur.settings.max}
                step={bigPlayerBlur.settings.step}
                tooltipValue={`${bigPlayerBlur.value}px`}
                onValueChange={([value]) => setBigPlayerBlurValue(value)}
            />
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
                <div className="w-2/5 flex items-center justify-end">{children}</div>
            </div>
        </>
    );
}
