import { cn } from "@/lib/utils";
import { usePlayerSpeed } from "@/store/player.store";
import React from "react";
import { useTranslation } from "react-i18next";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Slider } from "../ui/slider";

export interface EffectSliderControls {
    reverb: number,
    setReverb: (value: number) => void,
    impulse: string,
    setImpulse: (value: string) => void,
}

const impulsePresets = new Array(36).fill(null).map((_, i) => `spatial${i}`);

export default function EffectSliders(props: EffectSliderControls) {

    const { speed, setSpeed } = usePlayerSpeed();
    const { t } = useTranslation();


    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-col px-4 gap-1">
                <Label>{t("player.effects.speed")}</Label>
                <Slider
                    className={cn(
                        "cursor-pointer w-full"
                    )}
                    tooltipValue={speed.toString()}
                    value={[speed]}
                    min={0.6}
                    max={2}
                    step={0.01}
                    onValueChange={([value]) => setSpeed(value)}
                />
            </div>
            <div className="flex flex-col px-4 gap-1">
                <Label>{t("player.effects.reverb")}</Label>
                <Slider
                    className={cn(
                        "cursor-pointer w-full"
                    )}
                    tooltipValue={props.reverb.toString()}
                    value={[props.reverb]}
                    min={0}
                    max={1}
                    step={0.01}
                    onValueChange={([value]) => props.setReverb(value)}
                />
            </div>
            <Select value={props.impulse} onValueChange={props.setImpulse}>
                <SelectTrigger className="h-8 ring-offset-transparent focus:ring-0 focus:ring-transparent text-left">
                    <SelectValue>
                        <span className="text-sm text-foreground">
                            {props.impulse}
                        </span>
                    </SelectValue>
                </SelectTrigger>
                <SelectContent align="end">
                    <SelectGroup>
                        {impulsePresets.map((preset) => (
                            <SelectItem
                                key={preset}
                                value={preset}
                            >
                                <span className="text-sm text-foreground">
                                    {preset}
                                </span>
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    );
}