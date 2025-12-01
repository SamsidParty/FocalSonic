import { usePlayerFilterData, usePlayerRef } from "@/store/player.store";
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
import React, { useEffect, useState } from "react";
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
    { freq: 100, gain: 0, q: 0.7, type: "PEAK" },
    { freq: 200, gain: 0, q: 0.7, type: "PEAK" },
    { freq: 400, gain: 0, q: 0.7, type: "PEAK" },
    { freq: 800, gain: 0, q: 0.7, type: "PEAK" },
    { freq: 1600, gain: 0, q: 0.7, type: "PEAK" },
    { freq: 3200, gain: 0, q: 0.7, type: "PEAK" },
    { freq: 6400, gain: 0, q: 0.7, type: "PEAK" }
];

const glowFilter = () => ({
    filter: `
      drop-shadow(0 0 1px ${getCSSColor("--primary")})
      drop-shadow(0 0 3px ${getCSSColor("--primary")})
    `
});

export default function Equalizer() {

    const { filterData, setFilterData } = usePlayerFilterData();
    const [filters, setFilters] = useState(filterData ? JSON.parse(filterData) : defaultPreset);
    const playerRef = usePlayerRef();

    const reverb = filters[0]?.reverb || 0;
    const setReverb = (value: number) => {
        filters[0].reverb = value;
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

    useEffect(() => {
        if (!playerRef) return;
        playerRef.filterData = filterData;
    }, [playerRef, filterData]);

    return (
        <div>
            <FrequencyResponseGraph
                width={268}
                height={350}
                scale={scale}
                theme={theme}
                style={{ overflow: "visible" }}
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
                            key={index}
                            index={index}
                            filter={filter}
                            id={`filter-${index}`}
                        />

                        <FilterCurve
                            showPin
                            key={index}
                            index={index}
                            filter={filter}
                            active={false}
                            gradientId={`filter-${index}`}
                        />
                    </>
                ))}
            </FrequencyResponseGraph>

            <EffectSliders reverb={reverb} setReverb={setReverb} />
        </div>
    );
}