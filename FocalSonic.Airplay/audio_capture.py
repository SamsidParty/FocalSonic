"""
Platform dispatch for "capture FocalSonic's own browser audio".

Both backends solve the same problem — FocalSonic renders in an embedded browser
that plays audio from a *separate* child process, so capturing the host process
gets nothing and capturing the system mix would sweep up every other app — and
both hand back float32-LE interleaved frames at ``sample_rate``:

  * Windows: WASAPI process loopback over the WebView2 process tree
    (``process_capture`` + ``process_finder``).
  * Linux:   a PipeWire / PulseAudio tap on the QtWebEngine audio service's
    playback stream (``linux_capture``).

macOS isn't handled here — it has AirPlay natively.

Backends are imported lazily: each one's dependencies (comtypes on Windows, the
audio-server helpers on Linux) only exist on its own platform.
"""

from __future__ import annotations

import sys

# The Windows process-loopback client is set up against the 48 kHz shared-mode
# engine format, so the streamer resamples 48k -> 44.1k for RAOP. The Linux
# helpers resample for us on the way out, so we simply ask them for RAOP's rate
# and skip that step (which is also why Linux needs no `audioop`).
WINDOWS_CAPTURE_RATE = 48000
LINUX_CAPTURE_RATE = 44100


def is_supported() -> bool:
    return sys.platform == "win32" or sys.platform.startswith("linux")


def default_capture_rate() -> int:
    """Capture rate that suits this platform's backend."""
    return WINDOWS_CAPTURE_RATE if sys.platform == "win32" else LINUX_CAPTURE_RATE


def create_capture(host_pid: int, sample_rate: int, channels: int):
    """Build the capture backend for this platform.

    ``host_pid`` is FocalSonic's own PID; each backend locates the browser audio
    below it. The result exposes ``start(on_chunk)`` and ``stop()``.
    """
    if sys.platform == "win32":
        from process_capture import ProcessLoopbackCapture
        from process_finder import find_webview2_target

        # Audio plays in WebView2, not FocalSonic.exe — capture the WebView2 tree.
        target_pid = find_webview2_target(host_pid) or host_pid
        return ProcessLoopbackCapture(target_pid, sample_rate=sample_rate,
                                      channels=channels)

    if sys.platform.startswith("linux"):
        from linux_capture import ApplicationAudioCapture

        return ApplicationAudioCapture(host_pid, sample_rate=sample_rate,
                                       channels=channels)

    raise RuntimeError(f"Audio capture is not implemented on {sys.platform}")
