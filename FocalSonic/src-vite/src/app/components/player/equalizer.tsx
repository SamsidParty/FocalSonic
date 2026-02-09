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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Slider } from "../ui/slider";
import EffectSliders from "./effect-sliders";


const getCSSColor = (col: string) => window.getComputedStyle(document.documentElement).getPropertyValue(col);

interface AudioEffectPreset {
    id: string;
    name: string;
    filters: GraphFilter[];
    reverb: number;
    speed: number;
    impulse: string;
}

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


const builtInPresets: AudioEffectPreset[] = [
    {
        id: "flat",
        name: "Flat",
        filters: [
            { freq: 31, gain: 0, q: 1.41, type: "PEAK" },
            { freq: 62, gain: 0, q: 1.41, type: "PEAK" },
            { freq: 125, gain: 0, q: 1.41, type: "PEAK" },
            { freq: 250, gain: 0, q: 1.41, type: "PEAK" },
            { freq: 500, gain: 0, q: 1.41, type: "PEAK" },
            { freq: 1000, gain: 0, q: 1.41, type: "PEAK" },
            { freq: 2000, gain: 0, q: 1.41, type: "PEAK" },
            { freq: 4000, gain: 0, q: 1.41, type: "PEAK" },
            { freq: 8000, gain: 0, q: 1.41, type: "PEAK" },
            { freq: 16000, gain: 0, q: 1.41, type: "PEAK" }
        ],
        reverb: 0,
        speed: 1,
        impulse: ""
    },
    {
        id: "bass-boost",
        name: "Bass Boost",
        filters: [
            { freq: 31, gain: 8, q: 1.41, type: "PEAK" },
            { freq: 62, gain: 7, q: 1.41, type: "PEAK" },
            { freq: 125, gain: 5, q: 1.41, type: "PEAK" },
            { freq: 250, gain: 2, q: 1.41, type: "PEAK" },
            { freq: 500, gain: 0, q: 1.41, type: "PEAK" },
            { freq: 1000, gain: 0, q: 1.41, type: "PEAK" },
            { freq: 2000, gain: 0, q: 1.41, type: "PEAK" },
            { freq: 4000, gain: 0, q: 1.41, type: "PEAK" },
            { freq: 8000, gain: 0, q: 1.41, type: "PEAK" },
            { freq: 16000, gain: 0, q: 1.41, type: "PEAK" }
        ],
        reverb: 0,
        speed: 1,
        impulse: ""
    },
    {
        id: "bass-reducer",
        name: "Bass Reducer",
        filters: [
            { freq: 31, gain: -8, q: 1.41, type: "PEAK" },
            { freq: 62, gain: -6, q: 1.41, type: "PEAK" },
            { freq: 125, gain: -4, q: 1.41, type: "PEAK" },
            { freq: 250, gain: -2, q: 1.41, type: "PEAK" },
            { freq: 500, gain: 0, q: 1.41, type: "PEAK" },
            { freq: 1000, gain: 0, q: 1.41, type: "PEAK" },
            { freq: 2000, gain: 0, q: 1.41, type: "PEAK" },
            { freq: 4000, gain: 0, q: 1.41, type: "PEAK" },
            { freq: 8000, gain: 0, q: 1.41, type: "PEAK" },
            { freq: 16000, gain: 0, q: 1.41, type: "PEAK" }
        ],
        reverb: 0,
        speed: 1,
        impulse: ""
    },
    {
        id: "treble-boost",
        name: "Treble Boost",
        filters: [
            { freq: 31, gain: 0, q: 1.41, type: "PEAK" },
            { freq: 62, gain: 0, q: 1.41, type: "PEAK" },
            { freq: 125, gain: 0, q: 1.41, type: "PEAK" },
            { freq: 250, gain: 0, q: 1.41, type: "PEAK" },
            { freq: 500, gain: 0, q: 1.41, type: "PEAK" },
            { freq: 1000, gain: 1, q: 1.41, type: "PEAK" },
            { freq: 2000, gain: 3, q: 1.41, type: "PEAK" },
            { freq: 4000, gain: 5, q: 1.41, type: "PEAK" },
            { freq: 8000, gain: 7, q: 1.41, type: "PEAK" },
            { freq: 16000, gain: 8, q: 1.41, type: "PEAK" }
        ],
        reverb: 0,
        speed: 1,
        impulse: ""
    },
    {
        id: "treble-reducer",
        name: "Treble Reducer",
        filters: [
            { freq: 31, gain: 0, q: 1.41, type: "PEAK" },
            { freq: 62, gain: -0.6, q: 1.41, type: "PEAK" },
            { freq: 125, gain: -1.6, q: 1.41, type: "PEAK" },
            { freq: 250, gain: -5.0, q: 1.41, type: "PEAK" },
            { freq: 500, gain: -8.2, q: 1.41, type: "PEAK" },
            { freq: 1000, gain: -16, q: 1.41, type: "PEAK" },
            { freq: 2000, gain: -16, q: 1.41, type: "PEAK" },
            { freq: 4000, gain: -16, q: 1.41, type: "PEAK" },
            { freq: 8000, gain: -16, q: 1.41, type: "PEAK" },
            { freq: 16000, gain: -16, q: 1.41, type: "PEAK" }
        ],
        reverb: 0,
        speed: 1,
        impulse: ""
    },
    {
        id: "vocal-boost",
        name: "Vocal Boost",
        filters: [
            { freq: 31, gain: -2, q: 1.41, type: "PEAK" },
            { freq: 62, gain: -1, q: 1.41, type: "PEAK" },
            { freq: 125, gain: 0, q: 1.41, type: "PEAK" },
            { freq: 250, gain: 2, q: 1.41, type: "PEAK" },
            { freq: 500, gain: 4, q: 1.41, type: "PEAK" },
            { freq: 1000, gain: 5, q: 1.41, type: "PEAK" },
            { freq: 2000, gain: 5, q: 1.41, type: "PEAK" },
            { freq: 4000, gain: 3, q: 1.41, type: "PEAK" },
            { freq: 8000, gain: 1, q: 1.41, type: "PEAK" },
            { freq: 16000, gain: 0, q: 1.41, type: "PEAK" }
        ],
        reverb: 0,
        speed: 1,
        impulse: ""
    },
    {
        id: "loudness",
        name: "Loudness",
        filters: [
            { freq: 31, gain: 6, q: 1.41, type: "PEAK" },
            { freq: 62, gain: 5, q: 1.41, type: "PEAK" },
            { freq: 125, gain: 2, q: 1.41, type: "PEAK" },
            { freq: 250, gain: 0, q: 1.41, type: "PEAK" },
            { freq: 500, gain: -2, q: 1.41, type: "PEAK" },
            { freq: 1000, gain: -2, q: 1.41, type: "PEAK" },
            { freq: 2000, gain: 0, q: 1.41, type: "PEAK" },
            { freq: 4000, gain: 2, q: 1.41, type: "PEAK" },
            { freq: 8000, gain: 5, q: 1.41, type: "PEAK" },
            { freq: 16000, gain: 6, q: 1.41, type: "PEAK" }
        ],
        reverb: 0,
        speed: 1,
        impulse: ""
    },
    {
        id: "rock",
        name: "Rock",
        filters: [
            { freq: 31, gain: 5, q: 1.41, type: "PEAK" },
            { freq: 62, gain: 4, q: 1.41, type: "PEAK" },
            { freq: 125, gain: 2, q: 1.41, type: "PEAK" },
            { freq: 250, gain: -1, q: 1.41, type: "PEAK" },
            { freq: 500, gain: -2, q: 1.41, type: "PEAK" },
            { freq: 1000, gain: 1, q: 1.41, type: "PEAK" },
            { freq: 2000, gain: 3, q: 1.41, type: "PEAK" },
            { freq: 4000, gain: 4, q: 1.41, type: "PEAK" },
            { freq: 8000, gain: 5, q: 1.41, type: "PEAK" },
            { freq: 16000, gain: 5, q: 1.41, type: "PEAK" }
        ],
        reverb: 0,
        speed: 1,
        impulse: ""
    },
    {
        id: "pop",
        name: "Pop",
        filters: [
            { freq: 31, gain: -1, q: 1.41, type: "PEAK" },
            { freq: 62, gain: 1, q: 1.41, type: "PEAK" },
            { freq: 125, gain: 3, q: 1.41, type: "PEAK" },
            { freq: 250, gain: 4, q: 1.41, type: "PEAK" },
            { freq: 500, gain: 3, q: 1.41, type: "PEAK" },
            { freq: 1000, gain: 0, q: 1.41, type: "PEAK" },
            { freq: 2000, gain: -1, q: 1.41, type: "PEAK" },
            { freq: 4000, gain: 1, q: 1.41, type: "PEAK" },
            { freq: 8000, gain: 2, q: 1.41, type: "PEAK" },
            { freq: 16000, gain: 3, q: 1.41, type: "PEAK" }
        ],
        reverb: 0,
        speed: 1,
        impulse: ""
    },
    {
        id: "jazz",
        name: "Jazz",
        filters: [
            { freq: 31, gain: 3, q: 1.41, type: "PEAK" },
            { freq: 62, gain: 2, q: 1.41, type: "PEAK" },
            { freq: 125, gain: 1, q: 1.41, type: "PEAK" },
            { freq: 250, gain: 0, q: 1.41, type: "PEAK" },
            { freq: 500, gain: -2, q: 1.41, type: "PEAK" },
            { freq: 1000, gain: -2, q: 1.41, type: "PEAK" },
            { freq: 2000, gain: 0, q: 1.41, type: "PEAK" },
            { freq: 4000, gain: 2, q: 1.41, type: "PEAK" },
            { freq: 8000, gain: 3, q: 1.41, type: "PEAK" },
            { freq: 16000, gain: 4, q: 1.41, type: "PEAK" }
        ],
        reverb: 0,
        speed: 1,
        impulse: ""
    },
    {
        id: "classical",
        name: "Classical",
        filters: [
            { freq: 31, gain: 4, q: 1.41, type: "PEAK" },
            { freq: 62, gain: 3, q: 1.41, type: "PEAK" },
            { freq: 125, gain: 2, q: 1.41, type: "PEAK" },
            { freq: 250, gain: 1, q: 1.41, type: "PEAK" },
            { freq: 500, gain: -1, q: 1.41, type: "PEAK" },
            { freq: 1000, gain: -1, q: 1.41, type: "PEAK" },
            { freq: 2000, gain: 0, q: 1.41, type: "PEAK" },
            { freq: 4000, gain: 2, q: 1.41, type: "PEAK" },
            { freq: 8000, gain: 3, q: 1.41, type: "PEAK" },
            { freq: 16000, gain: 4, q: 1.41, type: "PEAK" }
        ],
        reverb: 0,
        speed: 1,
        impulse: ""
    },
    {
        id: "hip-hop",
        name: "Hip-Hop",
        filters: [
            { freq: 31, gain: 7, q: 1.41, type: "PEAK" },
            { freq: 62, gain: 6, q: 1.41, type: "PEAK" },
            { freq: 125, gain: 3, q: 1.41, type: "PEAK" },
            { freq: 250, gain: 1, q: 1.41, type: "PEAK" },
            { freq: 500, gain: -1, q: 1.41, type: "PEAK" },
            { freq: 1000, gain: -1, q: 1.41, type: "PEAK" },
            { freq: 2000, gain: 1, q: 1.41, type: "PEAK" },
            { freq: 4000, gain: 2, q: 1.41, type: "PEAK" },
            { freq: 8000, gain: 3, q: 1.41, type: "PEAK" },
            { freq: 16000, gain: 2, q: 1.41, type: "PEAK" }
        ],
        reverb: 0,
        speed: 1,
        impulse: ""
    },
    {
        id: "electronic",
        name: "Electronic",
        filters: [
            { freq: 31, gain: 6, q: 1.41, type: "PEAK" },
            { freq: 62, gain: 5, q: 1.41, type: "PEAK" },
            { freq: 125, gain: 2, q: 1.41, type: "PEAK" },
            { freq: 250, gain: 0, q: 1.41, type: "PEAK" },
            { freq: 500, gain: -2, q: 1.41, type: "PEAK" },
            { freq: 1000, gain: 0, q: 1.41, type: "PEAK" },
            { freq: 2000, gain: 2, q: 1.41, type: "PEAK" },
            { freq: 4000, gain: 4, q: 1.41, type: "PEAK" },
            { freq: 8000, gain: 5, q: 1.41, type: "PEAK" },
            { freq: 16000, gain: 6, q: 1.41, type: "PEAK" }
        ],
        reverb: 0,
        speed: 1,
        impulse: ""
    },
    {
        id: "r-and-b",
        name: "R&B",
        filters: [
            { freq: 31, gain: 4, q: 1.41, type: "PEAK" },
            { freq: 62, gain: 6, q: 1.41, type: "PEAK" },
            { freq: 125, gain: 4, q: 1.41, type: "PEAK" },
            { freq: 250, gain: 1, q: 1.41, type: "PEAK" },
            { freq: 500, gain: -2, q: 1.41, type: "PEAK" },
            { freq: 1000, gain: 1, q: 1.41, type: "PEAK" },
            { freq: 2000, gain: 2, q: 1.41, type: "PEAK" },
            { freq: 4000, gain: 2, q: 1.41, type: "PEAK" },
            { freq: 8000, gain: 3, q: 1.41, type: "PEAK" },
            { freq: 16000, gain: 2, q: 1.41, type: "PEAK" }
        ],
        reverb: 0,
        speed: 1,
        impulse: ""
    },
    {
        id: "acoustic",
        name: "Acoustic",
        filters: [
            { freq: 31, gain: 3, q: 1.41, type: "PEAK" },
            { freq: 62, gain: 2, q: 1.41, type: "PEAK" },
            { freq: 125, gain: 1, q: 1.41, type: "PEAK" },
            { freq: 250, gain: 2, q: 1.41, type: "PEAK" },
            { freq: 500, gain: 2, q: 1.41, type: "PEAK" },
            { freq: 1000, gain: 1, q: 1.41, type: "PEAK" },
            { freq: 2000, gain: 2, q: 1.41, type: "PEAK" },
            { freq: 4000, gain: 3, q: 1.41, type: "PEAK" },
            { freq: 8000, gain: 2, q: 1.41, type: "PEAK" },
            { freq: 16000, gain: 1, q: 1.41, type: "PEAK" }
        ],
        reverb: 0,
        speed: 1,
        impulse: ""
    },
    {
        id: "dance",
        name: "Dance",
        filters: [
            { freq: 31, gain: 5, q: 1.41, type: "PEAK" },
            { freq: 62, gain: 6, q: 1.41, type: "PEAK" },
            { freq: 125, gain: 3, q: 1.41, type: "PEAK" },
            { freq: 250, gain: 0, q: 1.41, type: "PEAK" },
            { freq: 500, gain: -1, q: 1.41, type: "PEAK" },
            { freq: 1000, gain: 2, q: 1.41, type: "PEAK" },
            { freq: 2000, gain: 4, q: 1.41, type: "PEAK" },
            { freq: 4000, gain: 4, q: 1.41, type: "PEAK" },
            { freq: 8000, gain: 4, q: 1.41, type: "PEAK" },
            { freq: 16000, gain: 3, q: 1.41, type: "PEAK" }
        ],
        reverb: 0,
        speed: 1,
        impulse: ""
    },
    {
        id: "metal",
        name: "Metal",
        filters: [
            { freq: 31, gain: 4, q: 1.41, type: "PEAK" },
            { freq: 62, gain: 3, q: 1.41, type: "PEAK" },
            { freq: 125, gain: 0, q: 1.41, type: "PEAK" },
            { freq: 250, gain: -2, q: 1.41, type: "PEAK" },
            { freq: 500, gain: -3, q: 1.41, type: "PEAK" },
            { freq: 1000, gain: 0, q: 1.41, type: "PEAK" },
            { freq: 2000, gain: 2, q: 1.41, type: "PEAK" },
            { freq: 4000, gain: 4, q: 1.41, type: "PEAK" },
            { freq: 8000, gain: 5, q: 1.41, type: "PEAK" },
            { freq: 16000, gain: 4, q: 1.41, type: "PEAK" }
        ],
        reverb: 0,
        speed: 1,
        impulse: ""
    },
    {
        id: "small-speakers",
        name: "Small Speakers",
        filters: [
            { freq: 31, gain: 6, q: 1.41, type: "PEAK" },
            { freq: 62, gain: 5, q: 1.41, type: "PEAK" },
            { freq: 125, gain: 4, q: 1.41, type: "PEAK" },
            { freq: 250, gain: 2, q: 1.41, type: "PEAK" },
            { freq: 500, gain: 1, q: 1.41, type: "PEAK" },
            { freq: 1000, gain: 0, q: 1.41, type: "PEAK" },
            { freq: 2000, gain: -1, q: 1.41, type: "PEAK" },
            { freq: 4000, gain: -2, q: 1.41, type: "PEAK" },
            { freq: 8000, gain: -3, q: 1.41, type: "PEAK" },
            { freq: 16000, gain: -4, q: 1.41, type: "PEAK" }
        ],
        reverb: 0,
        speed: 1,
        impulse: ""
    },
    {
        id: "headphones",
        name: "Headphones",
        filters: [
            { freq: 31, gain: 3, q: 1.41, type: "PEAK" },
            { freq: 62, gain: 4, q: 1.41, type: "PEAK" },
            { freq: 125, gain: 2, q: 1.41, type: "PEAK" },
            { freq: 250, gain: -1, q: 1.41, type: "PEAK" },
            { freq: 500, gain: -2, q: 1.41, type: "PEAK" },
            { freq: 1000, gain: 1, q: 1.41, type: "PEAK" },
            { freq: 2000, gain: 2, q: 1.41, type: "PEAK" },
            { freq: 4000, gain: 3, q: 1.41, type: "PEAK" },
            { freq: 8000, gain: 3, q: 1.41, type: "PEAK" },
            { freq: 16000, gain: 2, q: 1.41, type: "PEAK" }
        ],
        reverb: 0,
        speed: 1,
        impulse: ""
    },
    {
        id: "late-night",
        name: "Late Night",
        filters: [
            { freq: 31, gain: 4, q: 1.41, type: "PEAK" },
            { freq: 62, gain: 3, q: 1.41, type: "PEAK" },
            { freq: 125, gain: 1, q: 1.41, type: "PEAK" },
            { freq: 250, gain: 0, q: 1.41, type: "PEAK" },
            { freq: 500, gain: 0, q: 1.41, type: "PEAK" },
            { freq: 1000, gain: 0, q: 1.41, type: "PEAK" },
            { freq: 2000, gain: -1, q: 1.41, type: "PEAK" },
            { freq: 4000, gain: -2, q: 1.41, type: "PEAK" },
            { freq: 8000, gain: -4, q: 1.41, type: "PEAK" },
            { freq: 16000, gain: -5, q: 1.41, type: "PEAK" }
        ],
        reverb: 0,
        speed: 1,
        impulse: ""
    },
    {
        id: "v-shape",
        name: "V-Shape",
        filters: [
            { freq: 31, gain: 6, q: 1.41, type: "PEAK" },
            { freq: 62, gain: 5, q: 1.41, type: "PEAK" },
            { freq: 125, gain: 3, q: 1.41, type: "PEAK" },
            { freq: 250, gain: 0, q: 1.41, type: "PEAK" },
            { freq: 500, gain: -3, q: 1.41, type: "PEAK" },
            { freq: 1000, gain: -3, q: 1.41, type: "PEAK" },
            { freq: 2000, gain: 0, q: 1.41, type: "PEAK" },
            { freq: 4000, gain: 3, q: 1.41, type: "PEAK" },
            { freq: 8000, gain: 5, q: 1.41, type: "PEAK" },
            { freq: 16000, gain: 6, q: 1.41, type: "PEAK" }
        ],
        reverb: 0,
        speed: 1,
        impulse: ""
    }
];

const findMatchingPreset = (filters: GraphFilter[]): AudioEffectPreset | null => {
    return builtInPresets.find(preset => 
        preset.filters.every((presetFilter, index) => {
            const currentFilter = filters[index];
            if (!currentFilter) return false;
            return (
                presetFilter.freq === currentFilter.freq &&
                Math.abs(presetFilter.gain - currentFilter.gain) < 0.01
            );
        })) || null;
};

const glowFilter = () => ({
    filter: `
      drop-shadow(0 0 1px ${getCSSColor("--primary")})
      drop-shadow(0 0 3px ${getCSSColor("--primary")})
    `
});

export default function Equalizer({ orientation = "vertical", small = true }: { orientation?: "horizontal" | "vertical", small?: boolean }) {

    const { filterData, setFilterData } = usePlayerFilterData();
    const [filters, setFilters] = useState(filterData ? JSON.parse(filterData) : builtInPresets[0].filters);
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

    const applyPreset = (preset: AudioEffectPreset) => {
        setReverb(preset.reverb);
        setSpeed(preset.speed);
        setImpulse(preset.impulse);
        setFilterData(JSON.stringify(preset.filters));
        setFilters(preset.filters);
    };

    const resetEffects = () => {
        setReverb(0);
        setSpeed(1);
        setImpulse("");
        setFilterData(JSON.stringify(builtInPresets[0].filters));
        setFilters([...builtInPresets[0].filters]);
    };

    const EqualizerComponent = SliderBasedEqualizer;

    const currentPreset = findMatchingPreset(filters);
    const currentPresetId = currentPreset?.id || "custom";

    const handlePresetChange = (presetId: string) => {
        const preset = builtInPresets.find(p => p.id === presetId);
        if (preset) {
            applyPreset(preset);
        }
    };

    return (
        <>
            <div className={clsx("flex flex-col justify-center items-center max-w-[50vw] ", !small && "mx-auto", orientation == "horizontal" ? "h-full frequency-graph" : "")}>
                <span className={clsx("mt-2 text-foreground w-full font-bold items-center flex", small ? "px-2" : "px-32")}>
                    <div className="flex ml-1">
                        <p className={clsx("text-foreground font-bold")}>{t("player.effects.title")}</p>
                    </div>
                    <div className="flex ml-auto">
                        <Button className="h-8 gap-1 p-2" size="sm" variant="secondary" onClick={resetEffects}>
                            <ListX size={16} />
                            {t("queue.clear")}
                        </Button>
                    </div>
                </span>
                <div className={clsx("w-full mt-2", small ? "px-2" : "px-32")}>
                    <Select value={currentPresetId} onValueChange={handlePresetChange}>
                        <SelectTrigger className="w-full h-9">
                            <SelectValue>
                                {currentPreset ? currentPreset.name : "Custom"}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {builtInPresets.map((preset) => (
                                <SelectItem key={preset.id} value={preset.id}>
                                    {preset.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <EqualizerComponent handleFilterChange={handleFilterChange} filters={filters} />
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