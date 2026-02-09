import { cn } from "@/lib/utils";
import { usePlayerFilterData, usePlayerRef, usePlayerSpeed } from "@/store/player.store";
import clsx from "clsx";
import {
    CompositeCurve,
    FilterChangeEvent,
    FilterCurve,
    FilterGradient,
    FilterPoint,
    FrequencyResponseGraph,
    GraphFilter,
    GraphThemeOverride
} from "dsssp";
import { t } from "i18next";
import { ListX } from "lucide-react";
import React, { useState } from "react";
import { Button } from "../ui/button";
import { Slider } from "../ui/slider";
import EffectSliders from "./effect-sliders";


const getCSSColor = (col: string) => window.getComputedStyle(document.documentElement).getPropertyValue(col);


const theme: GraphThemeOverride = {
    background: {
        grid: {
            lineColor: "#ffffff00"
        },
        gradient: {
            start: "#ffffff00",
            stop: "#ffffff00",
            direction: "DIAGONAL_BL_TR"
        },
        label: {
            color: "#ffffff00",
            fontSize: 0,
        }
    },
    filters: {
        gradientOpacity: 0.05,
        point: {
            backgroundOpacity: {
                active: 1,
                drag: 1
            }
        },
        curve: {
            opacity: {
                active: 0.1,
                normal: 0.1
            }
        },
        defaultColor: "white"
    }
};

const scale = {
    minFreq: 20,
    maxFreq: 20000,
    sampleRate: 44100, // need to test 96000 in all browsers
    dbSteps: 4,
    maxGain: 12,
    minGain: -12
};

const defaultPreset: GraphFilter[] = [
    { freq: 31, gain: 0, q: 1.41, type: "PEAK" },   // Sub-bass
    { freq: 62, gain: 0, q: 1.41, type: "PEAK" },   // Bass
    { freq: 125, gain: 0, q: 1.41, type: "PEAK" },  // Low-mids
    { freq: 250, gain: 0, q: 1.41, type: "PEAK" },  // Low-mids
    { freq: 500, gain: 0, q: 1.41, type: "PEAK" },  // Midrange
    { freq: 1000, gain: 0, q: 1.41, type: "PEAK" }, // Midrange
    { freq: 2000, gain: 0, q: 1.41, type: "PEAK" }, // Upper-mids
    { freq: 4000, gain: 0, q: 1.41, type: "PEAK" }, // Presence
    { freq: 8000, gain: 0, q: 1.41, type: "PEAK" }, // Brilliance
    { freq: 16000, gain: 0, q: 1.41, type: "PEAK" } // Air/Extreme Highs
];

const glowFilter = () => ({
    filter: `
      drop-shadow(0 0 1px ${getCSSColor("--primary")})
      drop-shadow(0 0 3px ${getCSSColor("--primary")})
    `
});

export default function Equalizer({ orientation = "vertical", small = true }: { orientation?: "horizontal" | "vertical", small?: boolean }) {

    const { filterData, setFilterData } = usePlayerFilterData();
    const [filters, setFilters] = useState(filterData ? JSON.parse(filterData) : defaultPreset);
    const { speed, setSpeed } = usePlayerSpeed();
    const playerRef = usePlayerRef();

    const reverb = filters[0]?.reverb || 0;
    const setReverb = (value: number) => {
        filters[0].reverb = value;
        setFilterData(JSON.stringify(filters));
        setFilters([...filters]);
    };

    const impulse = filters[0]?.impulse || "";
    const setImpulse = (value: string) => {
        filters[0].impulse = value;
        setFilterData(JSON.stringify(filters));
        setFilters([...filters]);
    };

    
    const handleFilterChange = (filterEvent: FilterChangeEvent) => {
        const { index, ...filter } = filterEvent;

        setFilters((prevFilters) => {
            const newFilters = [...prevFilters];
            newFilters[index] = { ...newFilters[index], ...filter };
            setFilterData(JSON.stringify(newFilters));
            return newFilters;
        });
    };

    const resetFilters = () => {
        setReverb(0);
        setSpeed(1);
        setImpulse("");
        setFilterData(JSON.stringify(defaultPreset));
        setFilters([...defaultPreset]);
    };

    const EqualizerComponent = SliderBasedEqualizer;

    return (
        <>
            <div className={clsx("flex flex-col justify-center items-center max-w-[50vw] ", !small && "mx-auto", orientation == "horizontal" ? "h-full frequency-graph" : "")}>
                <span className={clsx("mt-2 text-foreground w-full font-bold items-center flex", small ? "px-2" : "px-32")}>
                    <div className="flex ml-1">
                        <p className={clsx("text-foreground font-bold")}>{t("player.effects.title")}</p>
                    </div>
                    <div className="flex ml-auto">
                        <Button className="h-8 gap-1 p-2" size="sm" variant="secondary" onClick={resetFilters}>
                            <ListX size={16} />
                            {t("queue.clear")}
                        </Button>
                    </div>
                </span>
                <EqualizerComponent handleFilterChange={handleFilterChange} filters={filters} orientation={orientation} />
                <EffectSliders reverb={reverb} setReverb={setReverb} impulse={impulse} setImpulse={setImpulse} orientation={orientation} />
            </div>
        </>
    );
}

function SliderBasedEqualizer({
    handleFilterChange,
    filters,
}: {
    handleFilterChange: (event: FilterChangeEvent) => void;
    filters: GraphFilter[];
}) {

    const maxDB = 16;

    const formatHz = (freq: number) => {
        if (freq >= 1000) {
            return `${(freq / 1000).toFixed(0)}\nkHz`;
        }
        return `${freq}\nHz`;
    };

    return (
        <div className={clsx("flex items-end justify-between px-4 my-4 flex-col w-full max-w-[28rem]")}>
            <div className={clsx("flex items-end w-full justify-between")}>
                {filters.map((filter, index) => (
                    <div key={index} className="flex flex-col items-center select-none min-w-[1.5rem]">
                        <div className="text-[8px] mb-2 text-center whitespace-pre">{formatHz(Math.round(filter.freq))}</div>

                        <div className="flex items-center">
                            <Slider
                                className={cn(
                                    "cursor-pointer h-full h-40"
                                )}
                                tooltipValue={filter.gain.toString()}
                                value={[filter.gain]}
                                min={-maxDB}
                                max={maxDB}
                                step={0.01}
                                orientation="vertical"  
                                handleStyle="default-always-visible"  
                                onValueChange={([value]) => handleFilterChange({ index, gain: value } as unknown as FilterChangeEvent)}
                            />
                        </div>

                        <div className="text-[8px] mt-2 text-center whitespace-pre">{filter.gain.toFixed(1)}<br/>dB</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function GraphEqualizer({ handleFilterChange, filters, orientation }: { handleFilterChange: (event: FilterChangeEvent) => void, filters: GraphFilter[], orientation: "horizontal" | "vertical" }) {
    
    return (
        <FrequencyResponseGraph
            width={orientation == "vertical" ? 268 : 600}
            height={orientation == "vertical" ? 350 : 268}
            scale={scale}
            theme={theme}
            className={clsx(
                "overflow-visible",
                orientation == "horizontal" ? "self-center" : ""
            )}
        >
            <FilterGradient
                fill
                opacity={0.2}
                color={getCSSColor("--primary")}
                id="composite-curve"
            />
            <CompositeCurve
                color={getCSSColor("--primary")}
                filters={filters}
                gradientId="composite-curve"
            />
            <CompositeCurve
                color={getCSSColor("--primary")}
                filters={filters}
                style={glowFilter()}
            />

            {filters.map((filter, index) => (
                <FilterPoint
                    key={index}
                    index={index}
                    filter={filter}
                    radius={4}
                    color={getCSSColor("--primary")}
                    dragColor="#ffffff"
                    activeColor="#ffffff"
                    background="transparent"
                    dragBackground="transparent"
                    activeBackground="transparent"
                    backgroundOpacity={1}
                    dragBackgroundOpacity={1}
                    activeBackgroundOpacity={1}
                    onChange={handleFilterChange}
                />
            ))}

            {filters.map((filter, index) => (
                <>
                    <FilterGradient
                        fill
                        key={index + "_gradient"}
                        index={index}
                        filter={filter}
                        id={`filter-${index}`}
                    />

                    <FilterCurve
                        showPin
                        key={index + "_curve"}
                        index={index}
                        filter={filter}
                        active={false}
                        gradientId={`filter-${index}`}
                    />
                </>
            ))}
        </FrequencyResponseGraph>
    );
}