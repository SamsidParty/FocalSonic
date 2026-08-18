"""
Generates the bundled impulse responses in
FocalSonic/src-vite/public/meta/impulse.

The presets aim for a smooth, "heavenly" reverb profile rather than a literal
room simulation: no discrete early reflections (those are what make a sampled
space sound like an empty stadium), a short pre-delay, a soft bloom into the
tail, frequency dependent decay that keeps air without hiss, and a stereo image
that widens as the tail develops.

Requires numpy + scipy. Run from anywhere:

    python Tools/generate-impulses.py

Ids must stay in sync with impulsePresets in
FocalSonic/src-vite/src/utils/audioEffects.ts. The name on each preset below is
only the character it was voiced for; the label the UI shows lives in
FocalSonic/src-vite/src/i18n/locales/en.json under player.effects.impulses.
"""

from __future__ import annotations

import wave
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
from scipy import signal

SAMPLE_RATE = 48000
OUTPUT_DIRECTORY = Path(__file__).resolve().parents[1] / "FocalSonic" / "src-vite" / "public" / "meta" / "impulse"

# Band edges the decay and tone shaping are described in. Sub is rolled off hard
# (a long low tail is what turns reverb into mud) and air decays fastest, the way
# real air absorption behaves.
BAND_EDGES = [180.0, 520.0, 1400.0, 3500.0, 8000.0]
BAND_NAMES = ["sub", "low", "low-mid", "mid", "high", "air"]

# Multipliers on the preset's RT60, per band. Shared by every preset so they all
# decay with the same natural shape, only the overall length and tone differ.
BAND_DECAY = np.array([0.55, 0.85, 1.00, 0.98, 0.80, 0.55])


@dataclass
class Preset:
    id: str
    # What the preset was voiced for. Documentation only, and the default
    # English label that ships in en.json.
    name: str
    # Mid band RT60 in seconds
    rt60: float
    # Silence before the tail starts, in seconds
    predelay: float
    # Bloom time constant of the mid bands, in seconds
    attack: float
    # Per band tone shaping in dB, in BAND_NAMES order
    tone: list[float]
    # 0 = mono, 1 = fully decorrelated tail
    width: float
    seed: int
    # Extra multipliers on BAND_DECAY, for presets that want a darker or airier
    # tail than the shared shape gives
    decay_tilt: list[float] = field(default_factory=lambda: [1.0] * 6)


# Ordered small to large. The first entry is what an unset impulse falls back to,
# so it is deliberately the most conservative of the set.
PRESETS = [
    Preset(
        id="preset1", name="Velvet", rt60=1.1, predelay=0.008, attack=0.014,
        tone=[-13, -4, -1, 0, 0, -4], width=0.70, seed=1001,
    ),
    Preset(
        id="preset2", name="Halo", rt60=1.9, predelay=0.015, attack=0.030,
        tone=[-13, -5, -3, 0, 2, 0], width=0.85, seed=1002,
        decay_tilt=[1.0, 1.0, 1.0, 1.05, 1.15, 1.15],
    ),
    Preset(
        id="preset3", name="Chapel", rt60=2.8, predelay=0.022, attack=0.040,
        tone=[-14, -4, -1, 0, 0, -5], width=0.80, seed=1003,
    ),
    Preset(
        id="preset4", name="Aurora", rt60=3.6, predelay=0.026, attack=0.075,
        tone=[-15, -7, -4, 0, 3, 1], width=0.88, seed=1004,
        decay_tilt=[0.9, 0.95, 1.0, 1.1, 1.25, 1.3],
    ),
    Preset(
        id="preset5", name="Cathedral", rt60=5.0, predelay=0.032, attack=0.060,
        tone=[-13, -3, -1, 0, -1, -7], width=0.82, seed=1005,
    ),
    Preset(
        id="preset6", name="Nebula", rt60=6.5, predelay=0.040, attack=0.130,
        tone=[-15, -6, -2, 0, -2, -9], width=1.0, seed=1006,
        decay_tilt=[1.0, 1.05, 1.05, 1.0, 0.9, 0.8],
    ),
    Preset(
        id="preset7", name="Ascension", rt60=8.0, predelay=0.045, attack=0.170,
        tone=[-15, -6, -3, 0, 2, 0], width=1.0, seed=1007,
        decay_tilt=[0.85, 0.95, 1.0, 1.1, 1.2, 1.2],
    ),
    Preset(
        id="preset8", name="Firmament", rt60=9.5, predelay=0.050, attack=0.240,
        tone=[-16, -8, -4, 0, 1, -2], width=1.0, seed=1008,
        decay_tilt=[0.8, 0.9, 1.0, 1.1, 1.15, 1.05],
    ),
]


def band_masks(frequencies: np.ndarray) -> list[np.ndarray]:
    """
    Zero phase filter bank that sums to exactly 1, so splitting the noise into
    bands and summing it back changes nothing until the envelopes are applied.
    Crossovers are half an octave wide, which is gentle enough that no band edge
    ever colours the tail.
    """
    safe = np.maximum(frequencies, 1e-6)
    steps = []

    for edge in BAND_EDGES:
        # Raised cosine across the crossover, in log frequency
        x = np.clip(np.log2(safe / edge) / 0.5 + 0.5, 0.0, 1.0)
        steps.append(0.5 - 0.5 * np.cos(np.pi * x))

    masks = [1.0 - steps[0]]
    for lower, upper in zip(steps, steps[1:]):
        masks.append(lower - upper)
    masks.append(steps[-1])

    return masks


def split_into_bands(noise: np.ndarray) -> list[np.ndarray]:
    spectrum = np.fft.rfft(noise)
    frequencies = np.fft.rfftfreq(noise.size, 1.0 / SAMPLE_RATE)
    return [np.fft.irfft(spectrum * mask, n=noise.size) for mask in band_masks(frequencies)]


def band_envelope(t: np.ndarray, rt60: float, attack: float, tone_db: float) -> np.ndarray:
    """
    Bloom into an exponential decay. The attack is what removes the slap at the
    front of a sampled space and gives the tail its swell.
    """
    decay = 10.0 ** (-3.0 * t / rt60)
    bloom = 1.0 - np.exp(-t / max(attack, 1e-4))
    return bloom * decay * (10.0 ** (tone_db / 20.0))


def render_channel_pair(preset: Preset) -> np.ndarray:
    rng = np.random.default_rng(preset.seed)

    # Run a little past the RT60 so the tail is fully buried before the fade
    length = int(SAMPLE_RATE * (preset.rt60 * 1.05 + preset.attack))
    t = np.arange(length) / SAMPLE_RATE

    mid_bands = split_into_bands(rng.standard_normal(length))
    side_bands = split_into_bands(rng.standard_normal(length))

    mid = np.zeros(length)
    side = np.zeros(length)

    for index in range(len(BAND_NAMES)):
        rt60 = preset.rt60 * BAND_DECAY[index] * preset.decay_tilt[index]
        # The high bands bloom a touch slower, so the tail brightens as it opens
        attack = preset.attack * (1.0 + 0.35 * index / (len(BAND_NAMES) - 1))
        envelope = band_envelope(t, rt60, attack, preset.tone[index])

        mid += mid_bands[index] * envelope
        # The sides come up behind the centre, so the image starts focused and
        # spreads as the tail develops
        side += side_bands[index] * envelope * (1.0 - np.exp(-t / 0.12))

    side *= preset.width

    # Causal so the head stays clean: no rumble, no fizz above the top octave
    highpass = signal.butter(2, 95.0, btype="highpass", fs=SAMPLE_RATE, output="sos")
    lowpass = signal.butter(2, 15500.0, btype="lowpass", fs=SAMPLE_RATE, output="sos")
    mid = signal.sosfilt(lowpass, signal.sosfilt(highpass, mid))
    side = signal.sosfilt(lowpass, signal.sosfilt(highpass, side))

    stereo = np.stack([mid + side, mid - side], axis=1)

    # Raised cosine fade so the end of the tail is never a step
    fade_length = int(length * 0.15)
    fade = 0.5 + 0.5 * np.cos(np.linspace(0.0, np.pi, fade_length))
    stereo[-fade_length:] *= fade[:, None]

    predelay = np.zeros((int(SAMPLE_RATE * preset.predelay), 2))
    stereo = np.concatenate([predelay, stereo], axis=0)

    # ConvolverNode normalises by energy at playback time, so peak normalising
    # here is only about using the full word depth
    return stereo * (0.89 / np.max(np.abs(stereo)))


def write_wav(path: Path, samples: np.ndarray) -> None:
    quantized = np.clip(np.round(samples * 32767.0), -32768, 32767).astype("<i2")

    with wave.open(str(path), "wb") as handle:
        handle.setnchannels(2)
        handle.setsampwidth(2)
        handle.setframerate(SAMPLE_RATE)
        handle.writeframes(quantized.tobytes())


def measure_rt60(samples: np.ndarray) -> float:
    """Schroeder backwards integration, reported over the -5 to -35 dB span."""
    energy = np.mean(samples ** 2, axis=1)
    curve = np.cumsum(energy[::-1])[::-1]
    curve_db = 10.0 * np.log10(np.maximum(curve / curve[0], 1e-12))

    start = int(np.argmax(curve_db <= -5.0))
    end = int(np.argmax(curve_db <= -35.0))
    if end <= start:
        return float("nan")

    return 2.0 * (end - start) / SAMPLE_RATE


def main() -> None:
    OUTPUT_DIRECTORY.mkdir(parents=True, exist_ok=True)

    for preset in PRESETS:
        samples = render_channel_pair(preset)
        path = OUTPUT_DIRECTORY / f"{preset.id}.wav"
        write_wav(path, samples)

        print(
            f"{preset.id:<8} {preset.name:<11} {samples.shape[0] / SAMPLE_RATE:5.2f}s  "
            f"target RT60 {preset.rt60:4.1f}s  measured {measure_rt60(samples):4.1f}s  "
            f"{path.stat().st_size / 1024 / 1024:4.2f} MB"
        )


if __name__ == "__main__":
    main()
