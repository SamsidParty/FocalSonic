import { cn } from "@/lib/utils";
import { usePlayerSpeed } from "@/store/player.store";
import React from "react";
import { useTranslation } from "react-i18next";
import { Label } from "../ui/label";
import { Slider } from "../ui/slider";

export interface EffectSliderControls {
    reverb: number,
    setReverb: (value: number) => void,
}

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
                    max={1}
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
        </div>
    );
}