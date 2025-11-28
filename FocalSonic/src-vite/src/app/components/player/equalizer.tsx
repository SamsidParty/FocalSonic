import { usePlayerFilterData, usePlayerRef } from "@/store/player.store";
import {
    CompositeCurve,
    FilterChangeEvent,
    FilterGradient,
    FilterPoint,
    FrequencyResponseGraph,
    GraphFilter,
    GraphThemeOverride
} from "dsssp";
import React, { useEffect, useState } from "react";

const theme: GraphThemeOverride = {
    background: {
        grid: {
            dotted: true,
            lineColor: "#47464b",
            lineWidth: { border: 0 }
        },
        gradient: {
            start: "#080c10",
            stop: "#233546",
            direction: "DIAGONAL_BL_TR"
        },
        label: {
            color: "#959da9",
            fontSize: 10,
            fontFamily: "Poppins,sans-serif"
        }
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
    { freq: 100, gain: +4.0, q: 0.7, type: "PEAK" },
    { freq: 200, gain: -6.0, q: 0.7, type: "PEAK" },
    { freq: 400, gain: +7.0, q: 0.7, type: "PEAK" },
    { freq: 800, gain: -8.0, q: 0.7, type: "PEAK" },
    { freq: 1600, gain: +7.0, q: 0.7, type: "PEAK" },
    { freq: 3200, gain: -6.0, q: 0.7, type: "PEAK" },
    { freq: 6400, gain: +4.0, q: 0.7, type: "PEAK" }
];

export default function Equalizer() {

    const { filterData, setFilterData } = usePlayerFilterData();
    const [filters, setFilters] = useState(filterData ? JSON.parse(filterData) : defaultPreset);
    const playerRef = usePlayerRef();

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
        if (!playerRef?.current) return;
        playerRef.current.filterData = filterData;
    }, [playerRef, filterData]);

    console.log("Filters:", filterData);

    return (
        <div>
            <FrequencyResponseGraph
                width={260}
                height={220}
                scale={scale}
                theme={theme}
            >
                <FilterGradient
                    fill
                    opacity={0.2}
                    color="#71abe0"
                    id="composite-curve"
                />
                <CompositeCurve
                    color="#71abe0"
                    filters={filters}
                    gradientId="composite-curve"
                />
                <CompositeCurve
                    color="#ffffff"
                    filters={filters}
                />
                {filters.map((filter, index) => (
                    <FilterPoint
                        key={index}
                        index={index}
                        filter={filter}
                        radius={4}
                        color="#b3ddf3"
                        dragColor="#ffffff"
                        activeColor="#ffffff"
                        background="#b3ddf3"
                        dragBackground="#ffffff"
                        activeBackground="#ffffff"
                        backgroundOpacity={1}
                        dragBackgroundOpacity={1}
                        activeBackgroundOpacity={1}
                        onChange={handleFilterChange}
                    />
                ))}
            </FrequencyResponseGraph>
        </div>
    );
}