"""
Sample-rate conversion for the capture -> RAOP path.

Uses ``audioop.ratecv`` when it's there and falls back to an equivalent pure-Python
implementation when it isn't. ``audioop`` was removed from the standard library in
Python 3.13, and while the Windows module is built against 3.12, the Linux side
runs on whatever interpreter the distro ships — which is already past 3.13 on
current releases.

The fallback only has to carry the Windows capture rate (48 kHz) down to RAOP's
44.1 kHz, so linear interpolation — exactly what ``audioop.ratecv`` does — is the
right amount of machinery. Linux captures at 44.1 kHz to begin with, so neither
path runs there at all.
"""

from __future__ import annotations

import array

try:  # removed in Python 3.13
    import audioop  # type: ignore
except ImportError:  # pragma: no cover - depends on the interpreter
    audioop = None

HAVE_AUDIOOP = audioop is not None


def ratecv(fragment: bytes, width: int, nchannels: int, inrate: int, outrate: int,
           state):
    """``audioop.ratecv`` with a pure-Python fallback.

    Returns ``(converted_bytes, state)``; pass ``None`` as the initial state and
    then feed the returned state back in, so consecutive chunks join without a
    click at the seam.
    """
    if audioop is not None:
        return audioop.ratecv(fragment, width, nchannels, inrate, outrate, state)
    return _ratecv_py(fragment, width, nchannels, inrate, outrate, state)


def _ratecv_py(fragment: bytes, width: int, nchannels: int, inrate: int,
               outrate: int, state):
    """Linear-interpolation resampler over 16-bit frames.

    State is ``(previous_frame, position)``: the last input frame of the previous
    call and the fractional read position carried into this one. Treating that
    previous frame as virtual index 0 of this call's input is what lets output
    frames land between chunks without discontinuities.
    """
    if width != 2:
        raise ValueError(f"only 16-bit samples are supported, got width={width}")
    if inrate <= 0 or outrate <= 0:
        raise ValueError("rates must be positive")

    samples = array.array("h")
    samples.frombytes(fragment)
    nframes = len(samples) // nchannels
    if nframes == 0:
        return b"", state

    if state is None:
        previous = [0] * nchannels
        position = 0.0
    else:
        previous, position = state
        previous = list(previous)

    step = inrate / outrate
    out = array.array("h")

    # Virtual input frames: v[0] is `previous`, v[i] is input frame i-1. Emit while
    # both interpolation neighbours (v[i0], v[i0+1]) are available.
    while position < nframes:
        i0 = int(position)
        frac = position - i0
        base_a = (i0 - 1) * nchannels
        base_b = i0 * nchannels
        for c in range(nchannels):
            a = previous[c] if i0 == 0 else samples[base_a + c]
            b = samples[base_b + c]
            out.append(int(a + (b - a) * frac))
        position += step

    # Next call's virtual index 0 is this call's last input frame, so shift the
    # position back by the frames we just consumed.
    last = samples[(nframes - 1) * nchannels:]
    return out.tobytes(), (list(last), position - nframes)
