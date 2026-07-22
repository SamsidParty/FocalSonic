/**
 * Schema and validation for audio effects. speed is a number; filterData is a
 * JSON band array with reverb and impulse on band 0 (the shape FocalMK consumes).
 */

/** Number of bundled impulse responses offered in the UI (public/meta/impulse). */
export const IMPULSE_PRESET_COUNT = 36;

export const impulsePresets = new Array(IMPULSE_PRESET_COUNT)
    .fill(null)
    .map((_, i) => ({ id: `spatial${i}`, name: `Spatial ${i}` }));

/** Impulse responses imported from a user supplied wav are prefixed with this. */
export const CUSTOM_IMPULSE_PREFIX = "custom-";

export const EXPORT_FORMAT = "focalsonic-audio-effects";
export const EXPORT_VERSION = 1;

/** Filter types understood by FocalMK's `mapType` (playback/audio-effects.js). */
export const SUPPORTED_FILTER_TYPES = [
    "PEAK", "PEAKING",
    "LOWPASS", "LPF",
    "HIGHPASS", "HPF",
    "LOWSHELF", "LSHELF",
    "HIGHSHELF", "HSHELF",
    "BANDPASS",
    "NOTCH", "BANDSTOP",
    "ALLPASS",
];

/**
 * What the audio engine can actually handle. Imported configurations are allowed
 * to use this full range, which is considerably wider than the sliders expose.
 */
export const EFFECT_LIMITS = {
    maxBands: 64,
    minFreq: 10,
    maxFreq: 96000, // clamped again to nyquist at playback time
    maxGain: 96,
    minQ: 0.0001,
    maxQ: 1000,
    // HTMLMediaElement.playbackRate throws outside of this range
    minSpeed: 0.0625,
    maxSpeed: 16,
};

/** What the slider based UI is able to render without lying about the values. */
export const UI_LIMITS = {
    maxBands: 10,
    maxGain: 16,
    minSpeed: 0.6,
    maxSpeed: 2,
};

/** The 10 bands every built in preset uses. */
export const STANDARD_BANDS = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

export interface AudioEffectFilter {
    type: string
    freq: number
    gain: number
    q: number
}

export interface AudioEffectConfig {
    filters: AudioEffectFilter[]
    reverb: number
    impulse: string
    /** Original path of a custom impulse wav, kept only so export can round trip. */
    impulseFile?: string
    speed: number
}

export interface ImportResult {
    ok: boolean
    config?: AudioEffectConfig
    error?: string
}

export const isCustomImpulse = (impulse: string) =>
    typeof impulse === "string" && impulse.startsWith(CUSTOM_IMPULSE_PREFIX);

/**
 * Speed and reverb use a negative value to mean "switched off, but remember the
 * level". These resolve that convention down to what is actually applied.
 */
export const effectiveSpeed = (speed: number) => (speed > 0 ? speed : 1);
export const effectiveReverb = (reverb: number) => (reverb > 0 ? reverb : 0);

/** An empty impulse falls through to the first bundled one at playback time. */
export const effectiveImpulse = (impulse: string) => impulse || impulsePresets[0].id;

const isFiniteNumber = (value: unknown): value is number =>
    typeof value === "number" && Number.isFinite(value);

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/** Clamps magnitude while preserving the on/off sign. */
const clampSigned = (value: number, min: number, max: number) =>
    Math.sign(value) * clamp(Math.abs(value), min, max);

const normalizeType = (type: unknown) => {
    const upper = String(type ?? "").toUpperCase();
    return SUPPORTED_FILTER_TYPES.includes(upper) ? upper : null;
};

export function createFlatFilters(): AudioEffectFilter[] {
    return STANDARD_BANDS.map((freq) => ({ freq, gain: 0, q: 1.41, type: "PEAK" }));
}

export function createFlatConfig(speed = 1): AudioEffectConfig {
    return { filters: createFlatFilters(), reverb: 0, impulse: "", speed };
}

/**
 * Tolerant read of persisted effects. Never throws and never returns something
 * the UI can't hold, so a corrupted store degrades to Flat instead of a blank app.
 */
export function parseFilterData(filterData: string, speed: number): AudioEffectConfig {
    const safeSpeed = isFiniteNumber(speed) && speed !== 0
        ? clampSigned(speed, EFFECT_LIMITS.minSpeed, EFFECT_LIMITS.maxSpeed)
        : 1;

    if (typeof filterData !== "string" || !filterData.trim()) {
        return createFlatConfig(safeSpeed);
    }

    let parsed: unknown;

    try {
        parsed = JSON.parse(filterData);
    }
    catch {
        return createFlatConfig(safeSpeed);
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
        return createFlatConfig(safeSpeed);
    }

    const filters: AudioEffectFilter[] = [];

    for (const entry of parsed.slice(0, EFFECT_LIMITS.maxBands)) {
        if (!entry || typeof entry !== "object") { continue; }

        const raw = entry as Record<string, unknown>;
        if (!isFiniteNumber(raw.freq)) { continue; }

        filters.push({
            type: normalizeType(raw.type) ?? "PEAK",
            freq: clamp(raw.freq, EFFECT_LIMITS.minFreq, EFFECT_LIMITS.maxFreq),
            gain: isFiniteNumber(raw.gain) ? clamp(raw.gain, -EFFECT_LIMITS.maxGain, EFFECT_LIMITS.maxGain) : 0,
            q: isFiniteNumber(raw.q) ? clamp(raw.q, EFFECT_LIMITS.minQ, EFFECT_LIMITS.maxQ) : 1.41,
        });
    }

    if (filters.length === 0) {
        return createFlatConfig(safeSpeed);
    }

    const head = parsed[0] as Record<string, unknown> | null;
    const rawReverb = head?.reverb;
    const rawImpulse = head?.impulse;
    const rawImpulseFile = head?.impulseFile;

    return {
        filters,
        reverb: isFiniteNumber(rawReverb) ? clampSigned(rawReverb, 0, 1) : 0,
        impulse: typeof rawImpulse === "string" ? rawImpulse : "",
        impulseFile: typeof rawImpulseFile === "string" && rawImpulseFile ? rawImpulseFile : undefined,
        speed: safeSpeed,
    };
}

/** Chokepoint for reading a persisted speed back in. Never returns NaN or 0. */
export function sanitizeStoredSpeed(value: unknown): number {
    if (!isFiniteNumber(value) || value === 0) { return 1; }
    return clampSigned(value, EFFECT_LIMITS.minSpeed, EFFECT_LIMITS.maxSpeed);
}

/**
 * Chokepoint for reading persisted filter data back in. An empty value stays
 * empty (nothing has been configured yet), anything unusable collapses to Flat.
 */
export function sanitizeStoredFilterData(value: unknown, speed: number): string {
    if (typeof value !== "string" || !value.trim()) { return ""; }
    return serializeFilterData(parseFilterData(value, speed));
}

/**
 * Packs a config back into the array shape FocalMK consumes, smuggling reverb and
 * the impulse response onto the first band.
 */
export function serializeFilterData(config: AudioEffectConfig): string {
    const filters = config.filters.length > 0 ? config.filters : createFlatFilters();

    const payload = filters.map((filter, index) => {
        const band: Record<string, unknown> = {
            type: filter.type,
            freq: filter.freq,
            gain: filter.gain,
            q: filter.q,
        };

        if (index === 0) {
            band.reverb = config.reverb;
            band.impulse = config.impulse;

            if (config.impulseFile) {
                band.impulseFile = config.impulseFile;
            }
        }

        return band;
    });

    return JSON.stringify(payload);
}

/**
 * Whether the sliders can represent this config honestly. Anything outside their
 * range is still applied to the audio, we just refuse to draw a misleading UI.
 */
export function isConfigDisplayable(config: AudioEffectConfig): boolean {
    if (config.filters.length === 0 || config.filters.length > UI_LIMITS.maxBands) {
        return false;
    }

    const everyBandIsPlainPeak = config.filters.every((filter) =>
        (filter.type === "PEAK" || filter.type === "PEAKING") &&
        Math.abs(filter.gain) <= UI_LIMITS.maxGain,);

    if (!everyBandIsPlainPeak) { return false; }

    const speed = Math.abs(config.speed);
    if (speed < UI_LIMITS.minSpeed || speed > UI_LIMITS.maxSpeed) { return false; }

    if (Math.abs(config.reverb) > 1) { return false; }

    if (config.impulse && !impulsePresets.some((preset) => preset.id === config.impulse)) {
        return false;
    }

    return true;
}

export function buildExportPayload(config: AudioEffectConfig) {
    return {
        format: EXPORT_FORMAT,
        version: EXPORT_VERSION,
        speed: Math.abs(config.speed),
        speedEnabled: config.speed > 0,
        reverb: Math.abs(config.reverb),
        reverbEnabled: config.reverb > 0,
        impulse: config.impulse,
        ...(config.impulseFile ? { impulseFile: config.impulseFile } : {}),
        filters: config.filters.map((filter) => ({
            type: filter.type,
            freq: filter.freq,
            gain: filter.gain,
            q: filter.q,
        })),
    };
}

function validateFilters(raw: unknown): AudioEffectFilter[] | string {
    if (!Array.isArray(raw)) {
        return "\"filters\" must be an array";
    }

    if (raw.length === 0) {
        return "\"filters\" must contain at least one band";
    }

    if (raw.length > EFFECT_LIMITS.maxBands) {
        return `too many bands (${raw.length}, maximum is ${EFFECT_LIMITS.maxBands})`;
    }

    const filters: AudioEffectFilter[] = [];

    for (let index = 0; index < raw.length; index++) {
        const entry = raw[index];

        if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
            return `band ${index} is not an object`;
        }

        const band = entry as Record<string, unknown>;

        if (!isFiniteNumber(band.freq)) {
            return `band ${index} has a missing or non-numeric "freq"`;
        }

        if (band.freq < EFFECT_LIMITS.minFreq || band.freq > EFFECT_LIMITS.maxFreq) {
            return `band ${index} frequency ${band.freq} is outside ${EFFECT_LIMITS.minFreq}-${EFFECT_LIMITS.maxFreq} Hz`;
        }

        const gain = band.gain ?? 0;
        if (!isFiniteNumber(gain)) {
            return `band ${index} has a non-numeric "gain"`;
        }

        if (Math.abs(gain) > EFFECT_LIMITS.maxGain) {
            return `band ${index} gain ${gain} exceeds +/-${EFFECT_LIMITS.maxGain} dB`;
        }

        const q = band.q ?? 1.41;
        if (!isFiniteNumber(q)) {
            return `band ${index} has a non-numeric "q"`;
        }

        if (q < EFFECT_LIMITS.minQ || q > EFFECT_LIMITS.maxQ) {
            return `band ${index} q ${q} is outside ${EFFECT_LIMITS.minQ}-${EFFECT_LIMITS.maxQ}`;
        }

        const type = band.type === undefined ? "PEAK" : normalizeType(band.type);
        if (!type) {
            return `band ${index} has an unsupported type "${String(band.type)}"`;
        }

        filters.push({ type, freq: band.freq, gain, q });
    }

    return filters;
}

/**
 * Strict validation of an imported document. Rejects rather than repairs, so a
 * bad file surfaces an error. A returned impulseFile is copied by the backend.
 */
export function validateImportedConfig(raw: unknown): ImportResult {
    if (raw === null || typeof raw !== "object") {
        return { ok: false, error: "the file must contain a JSON object" };
    }

    // A bare array is accepted as a shorthand for just the bands
    const source = (Array.isArray(raw) ? { filters: raw } : raw) as Record<string, unknown>;

    if (source.format !== undefined && source.format !== EXPORT_FORMAT) {
        return { ok: false, error: `unknown format "${String(source.format)}"` };
    }

    if (source.version !== undefined) {
        if (!isFiniteNumber(source.version) || !Number.isInteger(source.version) || source.version < 1) {
            return { ok: false, error: "\"version\" must be a positive whole number" };
        }

        if (source.version > EXPORT_VERSION) {
            return { ok: false, error: `version ${source.version} is newer than this app supports (${EXPORT_VERSION})` };
        }
    }

    const filters = validateFilters(source.filters);
    if (typeof filters === "string") {
        return { ok: false, error: filters };
    }

    const rawSpeed = source.speed ?? 1;
    if (!isFiniteNumber(rawSpeed)) {
        return { ok: false, error: "\"speed\" must be a number" };
    }

    const speedMagnitude = Math.abs(rawSpeed);
    if (speedMagnitude < EFFECT_LIMITS.minSpeed || speedMagnitude > EFFECT_LIMITS.maxSpeed) {
        return {
            ok: false,
            error: `speed ${rawSpeed} is outside ${EFFECT_LIMITS.minSpeed}-${EFFECT_LIMITS.maxSpeed}`,
        };
    }

    if (source.speedEnabled !== undefined && typeof source.speedEnabled !== "boolean") {
        return { ok: false, error: "\"speedEnabled\" must be true or false" };
    }

    const rawReverb = source.reverb ?? 0;
    if (!isFiniteNumber(rawReverb)) {
        return { ok: false, error: "\"reverb\" must be a number" };
    }

    const reverbMagnitude = Math.abs(rawReverb);
    if (reverbMagnitude > 1) {
        return { ok: false, error: `reverb ${rawReverb} is outside 0-1` };
    }

    if (source.reverbEnabled !== undefined && typeof source.reverbEnabled !== "boolean") {
        return { ok: false, error: "\"reverbEnabled\" must be true or false" };
    }

    const rawImpulseFile = source.impulseFile;
    if (rawImpulseFile !== undefined) {
        if (typeof rawImpulseFile !== "string" || !rawImpulseFile.trim()) {
            return { ok: false, error: "\"impulseFile\" must be a path to a .wav file" };
        }

        if (!rawImpulseFile.trim().toLowerCase().endsWith(".wav")) {
            return { ok: false, error: "\"impulseFile\" must point at a .wav file" };
        }
    }

    const rawImpulse = source.impulse ?? "";
    if (typeof rawImpulse !== "string") {
        return { ok: false, error: "\"impulse\" must be a string" };
    }

    if (rawImpulse && !impulsePresets.some((preset) => preset.id === rawImpulse)) {
        // A custom id only means something alongside the wav it was made from
        if (!isCustomImpulse(rawImpulse) || rawImpulseFile === undefined) {
            return { ok: false, error: `unknown impulse response "${rawImpulse}"` };
        }
    }

    const speedEnabled = source.speedEnabled === undefined ? rawSpeed > 0 : source.speedEnabled;
    const reverbEnabled = source.reverbEnabled === undefined ? rawReverb > 0 : source.reverbEnabled;

    return {
        ok: true,
        config: {
            filters,
            speed: speedEnabled ? speedMagnitude : -speedMagnitude,
            reverb: reverbEnabled ? reverbMagnitude : -reverbMagnitude,
            impulse: rawImpulse,
            impulseFile: typeof rawImpulseFile === "string" ? rawImpulseFile.trim() : undefined,
        },
    };
}
