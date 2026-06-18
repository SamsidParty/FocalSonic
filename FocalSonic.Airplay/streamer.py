"""
AirPlay (RAOP) streaming via pyatv, fed from a live PCM queue.

Pipeline: ProcessLoopbackCapture (float32) -> restore gain (undo 1e-6 mute) ->
int16 -> resample to 44.1k -> drop-oldest queue -> LivePCMSource -> RAOP -> device.

pyatv's live-streaming source paths are broken on Windows (miniaudio), but its
RAOP sender is solid — so we monkey-patch `raop.open_source` to feed raw PCM
directly. See GUIDANCE.md §4/§6.
"""

from __future__ import annotations

import asyncio
import audioop
import logging

import numpy as np
import pyatv.protocols.raop as raop_mod
from pyatv.protocols.raop.audio_source import AudioSource, _to_audio_samples
from pyatv.support.metadata import EMPTY_METADATA

from process_capture import ProcessLoopbackCapture
from process_finder import find_webview2_target

log = logging.getLogger("focalsonic.airplay.streamer")

RAOP_RATE = 44100
RAOP_CHANNELS = 2
RAOP_SAMPLE_SIZE = 2  # bytes (s16)

# Drop-oldest queue: a few hundred ms of jitter headroom, no unbounded latency.
QUEUE_MAXSIZE = 12


class StartupSymbolError(RuntimeError):
    """Raised when pyatv's internal monkey-patch points have moved."""


def verify_pyatv_symbols() -> None:
    """Fail loudly if a pyatv upgrade moved the internals we monkey-patch."""
    missing = []
    if not hasattr(raop_mod, "open_source"):
        missing.append("pyatv.protocols.raop.open_source")
    if not callable(_to_audio_samples):
        missing.append("pyatv.protocols.raop.audio_source._to_audio_samples")
    if not hasattr(AudioSource, "NO_FRAMES"):
        missing.append("AudioSource.NO_FRAMES")
    if missing:
        raise StartupSymbolError(
            "pyatv internals required for live PCM streaming are missing: "
            + ", ".join(missing)
            + ". Pin pyatv and re-validate the monkey-patch."
        )


class LivePCMSource(AudioSource):
    """Feeds queued int16/44.1k PCM straight into pyatv's RAOP packetizer."""

    def __init__(self, queue: asyncio.Queue):
        self._q = queue
        self._buf = bytearray()
        self._ended = False

    async def readframes(self, nframes: int):
        need = nframes * RAOP_SAMPLE_SIZE * RAOP_CHANNELS
        while len(self._buf) < need and not self._ended:
            chunk = await self._q.get()
            if chunk is None:
                self._ended = True
                break
            self._buf.extend(chunk)

        if not self._buf:
            return AudioSource.NO_FRAMES

        out = bytes(self._buf[:need])
        del self._buf[:need]
        return _to_audio_samples(out)  # native s16 -> big-endian for RAOP

    async def get_metadata(self):
        return EMPTY_METADATA

    @property
    def sample_rate(self) -> int:
        return RAOP_RATE

    @property
    def channels(self) -> int:
        return RAOP_CHANNELS

    @property
    def sample_size(self) -> int:
        return RAOP_SAMPLE_SIZE

    @property
    def duration(self) -> int:
        return 0

    async def close(self) -> None:
        pass


class AirPlayStreamer:
    """Owns the capture -> resample -> RAOP pipeline for one session."""

    def __init__(self, loop: asyncio.AbstractEventLoop, host_pid: int,
                 capture_rate: int = 48000, gain_restore: float = 1_000_000.0):
        self.loop = loop
        self.host_pid = host_pid
        self.capture_rate = capture_rate
        self.gain_restore = gain_restore

        # Audio plays in WebView2, not FocalSonic.exe — capture the WebView2 tree.
        target_pid = find_webview2_target(host_pid) or host_pid
        self._queue: asyncio.Queue = asyncio.Queue(maxsize=QUEUE_MAXSIZE)
        self._capture = ProcessLoopbackCapture(target_pid, sample_rate=capture_rate,
                                               channels=RAOP_CHANNELS)
        self._ratecv_state = None
        self._atv = None

        # Audio-level diagnostics (silence vs flowing).
        self._diag_chunks = 0
        self._diag_raw_peak = 0.0
        self._diag_out_peak = 0.0

    # -- audio conversion (runs on the capture thread) ---------------------

    def _process_chunk(self, float_bytes: bytes) -> bytes:
        """float32 -> restore gain -> int16 -> resample to 44.1k."""
        arr = np.frombuffer(float_bytes, dtype="<f4").astype(np.float32)

        raw_peak = float(np.abs(arr).max()) if arr.size else 0.0

        if self.gain_restore != 1.0:
            arr = arr * self.gain_restore
        out_peak = float(np.abs(arr).max()) if arr.size else 0.0
        np.clip(arr, -1.0, 1.0, out=arr)
        i16 = (arr * 32767.0).astype("<i2").tobytes()

        self._log_levels(raw_peak, out_peak)

        if self.capture_rate != RAOP_RATE:
            i16, self._ratecv_state = audioop.ratecv(
                i16, RAOP_SAMPLE_SIZE, RAOP_CHANNELS,
                self.capture_rate, RAOP_RATE, self._ratecv_state,
            )
        return i16

    def _log_levels(self, raw_peak: float, out_peak: float) -> None:
        # Log peak roughly once a second to diagnose silence vs audio + gain restore.
        self._diag_raw_peak = max(self._diag_raw_peak, raw_peak)
        self._diag_out_peak = max(self._diag_out_peak, out_peak)
        self._diag_chunks += 1
        if self._diag_chunks >= 100:
            log.info(
                "audio level: captured peak=%.2e, after x%g restore=%.3f%s",
                self._diag_raw_peak, self.gain_restore, self._diag_out_peak,
                " (CLIPPING)" if self._diag_out_peak > 1.0 else
                (" (silent — is audio playing in FocalSonic?)" if self._diag_raw_peak < 1e-9 else ""),
            )
            self._diag_chunks = 0
            self._diag_raw_peak = 0.0
            self._diag_out_peak = 0.0

    def _on_capture_chunk(self, float_bytes: bytes) -> None:
        try:
            pcm = self._process_chunk(float_bytes)
        except Exception:  # noqa: BLE001
            log.exception("Failed to process capture chunk")
            return
        self.loop.call_soon_threadsafe(self._put_drop_oldest, pcm)

    def _put_drop_oldest(self, data: bytes) -> None:
        q = self._queue
        if q.full():
            try:
                q.get_nowait()
            except asyncio.QueueEmpty:
                pass
        try:
            q.put_nowait(data)
        except asyncio.QueueFull:
            pass

    # -- streaming ---------------------------------------------------------

    async def stream(self, atv) -> None:
        """Capture + stream until the device drops us or we're cancelled."""
        self._atv = atv
        source = LivePCMSource(self._queue)

        async def _patched_open_source(file, sample_rate, channels, sample_size):
            return source

        original_open_source = raop_mod.open_source
        raop_mod.open_source = _patched_open_source

        # Start capture only now, right before pyatv consumes, so audio doesn't pile up.
        self._capture.start(self._on_capture_chunk)
        try:
            await atv.stream.stream_file("live")  # arg ignored; our source is used
        finally:
            raop_mod.open_source = original_open_source
            self._capture.stop()
            self._put_drop_oldest_sentinel()  # unblock readframes if still waiting

    def _put_drop_oldest_sentinel(self) -> None:
        try:
            self._queue.put_nowait(None)
        except asyncio.QueueFull:
            try:
                self._queue.get_nowait()
            except asyncio.QueueEmpty:
                pass
            try:
                self._queue.put_nowait(None)
            except asyncio.QueueFull:
                pass

    def stop(self) -> None:
        self._capture.stop()
