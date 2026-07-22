import { cn } from "@/lib/utils";
import { usePlayerSpeed } from "@/store/player.store";
import { effectiveImpulse, impulsePresets, UI_LIMITS } from "@/utils/audioEffects";
import clsx from "clsx";
import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Slider } from "../ui/slider";

export interface EffectSliderControls {
    reverb: number,
    setReverb: (value: number) => void,
    impulse: string,
    setImpulse: (value: string) => void,
    orientation?: "horizontal" | "vertical"
}

export default function EffectSliders(props: EffectSliderControls) {

    const { speed: rawSpeed, setSpeed } = usePlayerSpeed();
    const { t } = useTranslation();

    // Fall back if speed is briefly undefined during rehydration
    const speed = typeof rawSpeed === "number" ? rawSpeed : 1;

    // Preserve the sign of speed when setting
    const setSpeedWrapper = (value: number) => {
        if (speed < 0) {
            setSpeed(-value);
        } else {
            setSpeed(value);
        }
    };

    // Same for reverb
    const setReverbWrapper = (value: number) => {
        if (props.reverb < 0) {
            props.setReverb(-value);
        } else {
            props.setReverb(value);
        }
    };

    return (
        <div className={clsx("flex px-4 gap-2 w-full", props.orientation == "horizontal" ? "flex-row justify-center" : "flex-col")}>
            <div className={clsx("flex flex-row gap-2")}>
                <EffectControlContainerVertical isActive={speed > 0} onToggle={() => setSpeed(-speed)}>
                    <Label>{t("player.effects.speed")}</Label>
                    <Slider
                        className={cn(
                            "cursor-pointer h-full"
                        )}
                        tooltipValue={speed.toString()}
                        value={[Math.abs(speed)]}
                        min={UI_LIMITS.minSpeed}
                        max={UI_LIMITS.maxSpeed}
                        step={0.01}
                        orientation="vertical"  
                        handleStyle="large"  
                        onValueChange={([value]) => setSpeedWrapper(value)}
                    />
                </EffectControlContainerVertical>
                <EffectControlContainerVertical onToggle={() => props.setReverb(-props.reverb)} isActive={props.reverb > 0}>
                    <Label>{t("player.effects.reverb")}</Label>
                    <Slider
                        className={cn(
                            "cursor-pointer h-full"
                        )}
                        tooltipValue={props.reverb.toString()}
                        value={[Math.abs(props.reverb)]}
                        min={0}
                        max={1}
                        orientation="vertical"
                        step={0.01}
                        handleStyle="large"
                        onValueChange={([value]) => setReverbWrapper(value)}
                    />
                </EffectControlContainerVertical>          
            </div>
            <EffectControlContainer label={t("player.effects.impulse")}>
                <Select value={effectiveImpulse(props.impulse)} onValueChange={props.setImpulse}>
                    <SelectTrigger className="h-8 mt-1 ring-offset-transparent focus:ring-0 focus:ring-transparent text-left">
                        <SelectValue>
                            <span className="text-sm text-foreground">
                                {impulsePresets.find(preset => preset.id === effectiveImpulse(props.impulse))?.name || impulsePresets[0].name}
                            </span>
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent align="end">
                        <SelectGroup>
                            {impulsePresets.map((preset) => (
                                <SelectItem
                                    key={preset.id}
                                    value={preset.id}
                                >
                                    <span className="text-sm text-foreground">
                                        {preset.name}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </EffectControlContainer>
        </div>
    );
}

function EffectControlContainer({ children, label }: { children: React.ReactNode, label?: string }) {
    return (
        <div className="flex flex-col py-2 gap-1 max-w-80 w-full rounded-md">
            <Label>{label}</Label>
            {children}
        </div>
    );
}

function EffectControlContainerVertical({ children, onToggle, isActive }: { children: React.ReactNode, onToggle?: () => void, isActive?: boolean }) {
    return (
        <div className={clsx("flex flex-col relative py-4 gap-4 items-center rounded-md w-full h-40 min-w-20", !isActive && "opacity-50")}>
            {children}
            <Button 
                className={
                    clsx(
                        "absolute bottom-2 right-2 w-4 h-4",
                        isActive ? "opacity-100 shadow-primary-glow" : "opacity-50"
                    )
                }
                    
                size="icon"
                onClick={onToggle}
            />
        </div>
    );
}