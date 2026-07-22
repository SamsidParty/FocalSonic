import { cn } from "@/lib/utils";
import { usePlayerFilterData, usePlayerSpeed } from "@/store/player.store";
import { getSharedFilterData, getSharedSpeed } from "@/store/shared.store";
import {
    AudioEffectConfig,
    AudioEffectFilter,
    buildExportPayload,
    effectiveImpulse,
    effectiveReverb,
    effectiveSpeed,
    isConfigDisplayable,
    parseFilterData,
    serializeFilterData,
    UI_LIMITS,
    validateImportedConfig
} from "@/utils/audioEffects";
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
import { Import, ListX, Save } from "lucide-react";
import { useMemo } from "react";
import { toast } from "react-toastify";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { SimpleTooltip } from "../ui/simple-tooltip";
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

const findMatchingPreset = (config: AudioEffectConfig): AudioEffectPreset | null => {
    return builtInPresets.find(preset =>
        preset.filters.length === config.filters.length &&
        effectiveSpeed(config.speed) === preset.speed &&
        effectiveReverb(config.reverb) === preset.reverb &&
        effectiveImpulse(config.impulse) === effectiveImpulse(preset.impulse) &&
        preset.filters.every((presetFilter, index) => {
            const currentFilter = config.filters[index];
            return (
                presetFilter.type === currentFilter.type &&
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
    const { speed, setSpeed } = usePlayerSpeed();

    const config = useMemo(() => parseFilterData(filterData, speed), [filterData, speed]);

    // Imported configurations can go well beyond what the sliders are able to
    // represent, in which case we say so rather than draw something misleading
    const canDisplay = isConfigDisplayable(config);

    // Read straight from the store rather than the render, so two edits landing in
    // the same tick can't have the second one overwrite the first
    const readConfig = () => parseFilterData(getSharedFilterData(), getSharedSpeed());

    const applyConfig = (next: AudioEffectConfig) => {
        setFilterData(serializeFilterData(next));

        // Speed lives outside of the filter data, so it only gets written when it
        // actually moved rather than on every slider tick
        if (next.speed !== getSharedSpeed()) {
            setSpeed(next.speed);
        }
    };

    const setReverb = (value: number) => applyConfig({ ...readConfig(), reverb: value });

    // Choosing a bundled impulse response drops any custom wav that was in use
    const setImpulse = (value: string) => applyConfig({ ...readConfig(), impulse: value, impulseFile: undefined });

    const handleFilterChange = (filterEvent: FilterChangeEvent) => {
        const { index, ...filter } = filterEvent;
        const current = readConfig();

        applyConfig({
            ...current,
            filters: current.filters.map((band, bandIndex) => bandIndex === index ? { ...band, ...filter } : band),
        });
    };

    const applyPreset = (preset: AudioEffectPreset) => {
        applyConfig({
            // Cloned, otherwise editing a slider would edit the preset itself
            filters: preset.filters.map((filter) => ({ ...filter })),
            reverb: preset.reverb,
            impulse: preset.impulse,
            speed: preset.speed,
        });
    };

    const resetEffects = () => applyPreset(builtInPresets[0]);

    const handleExport = async () => {
        const exporter = window.igniteView?.commandBridge?.exportAudioEffects;

        if (!exporter) {
            toast.error(t("player.effects.desktopOnly"));
            return;
        }

        try {
            const payload = JSON.stringify(buildExportPayload(readConfig()), null, 4);
            const result = JSON.parse(await exporter(payload)) as { ok?: boolean, cancelled?: boolean, error?: string };

            if (result?.cancelled) { return; }
            if (!result?.ok) { throw new Error(result?.error || "the file could not be written"); }

            toast.success(t("player.effects.exported"));
        }
        catch (error) {
            console.error("[Audio Effects] Export failed", error);
            toast.error(t("player.effects.exportFailed"));
        }
    };

    const handleImport = async () => {
        const importer = window.igniteView?.commandBridge?.importAudioEffects;

        if (!importer) {
            toast.error(t("player.effects.desktopOnly"));
            return;
        }

        try {
            // The native picker + file read happen in C#; it hands back the raw text
            const result = JSON.parse(await importer()) as { ok?: boolean, cancelled?: boolean, error?: string, content?: string };

            if (result?.cancelled) { return; }
            if (!result?.ok || typeof result.content !== "string") {
                throw new Error(result?.error || "the file could not be read");
            }

            let parsed: unknown;

            try {
                parsed = JSON.parse(result.content);
            }
            catch {
                throw new Error("the file is not valid JSON");
            }

            const validated = validateImportedConfig(parsed);

            if (!validated.ok || !validated.config) {
                throw new Error(validated.error || "the configuration could not be read");
            }

            const imported = validated.config;

            // A wav path wins over any impulse id in the file, since the id can only
            // ever refer to something that was imported on this machine
            if (imported.impulseFile) {
                imported.impulse = await importImpulseFile(imported.impulseFile);
            }

            applyConfig(imported);
            toast.success(t("player.effects.imported"));
        }
        catch (error) {
            console.error("[Audio Effects] Import failed", error);
            toast.error(t("player.effects.importFailed", {
                reason: error instanceof Error ? error.message : String(error),
            }));
        }
    };

    const currentPreset = findMatchingPreset(config);
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
                    <div className="relative w-full">
                        <Select value={currentPresetId} onValueChange={handlePresetChange}>
                            {/* pr leaves room for the overlaid buttons; the built-in chevron
                                is hidden ([&>svg]) since those buttons now sit in its place */}
                            <SelectTrigger className="w-full h-9 pr-[4.25rem] [&>svg]:hidden">
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

                        {/* Overlaid on the bar, sibling to the trigger (nested buttons are
                            invalid). Stops pointer events so a click can't fall through to Flat. */}
                        <div
                            className="absolute inset-y-0 right-1.5 z-10 flex items-center gap-0.5"
                            onPointerDown={(event) => event.stopPropagation()}
                        >
                            <SimpleTooltip text={t("player.effects.import")}>
                                <Button
                                    type="button"
                                    className="h-7 w-7 shrink-0 p-0 text-muted-foreground hover:text-foreground"
                                    size="icon"
                                    variant="ghost"
                                    aria-label={t("player.effects.import")}
                                    onPointerDown={(event) => event.stopPropagation()}
                                    onClick={(event) => { event.stopPropagation(); handleImport(); }}
                                >
                                    <Import size={15} />
                                </Button>
                            </SimpleTooltip>
                            <SimpleTooltip text={t("player.effects.export")}>
                                <Button
                                    type="button"
                                    className="h-7 w-7 shrink-0 p-0 text-muted-foreground hover:text-foreground"
                                    size="icon"
                                    variant="ghost"
                                    aria-label={t("player.effects.export")}
                                    onPointerDown={(event) => event.stopPropagation()}
                                    onClick={(event) => { event.stopPropagation(); handleExport(); }}
                                >
                                    {/* Slightly smaller than the other icon so that it looks better */}
                                    <Save size={14} />
                                </Button>
                            </SimpleTooltip>
                        </div>
                    </div>
                </div>
                {canDisplay ? (
                    <>
                        <SliderBasedEqualizer handleFilterChange={handleFilterChange} filters={config.filters} />
                        <EffectSliders reverb={config.reverb} setReverb={setReverb} impulse={config.impulse} setImpulse={setImpulse} orientation={orientation} />
                    </>
                ) : (
                    <div className={clsx("w-full my-4", small ? "px-2" : "px-32")}>
                        <p className="rounded-md border border-border bg-secondary/40 p-4 text-center text-sm font-normal text-muted-foreground">
                            {t("player.effects.tooComplex")}
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}

/**
 * Hands a wav path to the desktop backend, which validates it and copies it into
 * the overrides folder. Returns the impulse id to store against the config.
 */
async function importImpulseFile(path: string): Promise<string> {
    const bridge = window.igniteView?.commandBridge;

    if (!bridge?.importImpulseOverride) {
        throw new Error("custom impulse responses are only supported in the desktop app");
    }

    let response: { ok?: boolean, id?: string, error?: string };

    try {
        response = JSON.parse(await bridge.importImpulseOverride(path));
    }
    catch {
        throw new Error("the impulse response could not be imported");
    }

    if (!response?.ok || !response.id) {
        throw new Error(response?.error || "the impulse response could not be imported");
    }

    return response.id;
}

function SliderBasedEqualizer({
    handleFilterChange,
    filters,
}: {
    handleFilterChange: (event: FilterChangeEvent) => void;
    filters: AudioEffectFilter[];
}) {

    const maxDB = UI_LIMITS.maxGain;

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