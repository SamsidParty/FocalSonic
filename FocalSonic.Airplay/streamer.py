"""
AirPlay (RAOP) streaming via pyatv, fed from a live PCM queue.

Pipeline: platform capture (float32) -> restore gain (undo 1e-6 mute) -> int16 ->
resample to 44.1k if needed -> drop-oldest queue -> LivePCMSource -> RAOP -> device.

The capture backend is chosen by `audio_capture` (WASAPI process loopback on
Windows, a PipeWire/PulseAudio stream tap on Linux); both deliver float32 frames,
so everything from here down is platform-independent. Linux captures at 44.1k
directly, which makes the resample step a no-op there.

pyatv's live-streaming source paths are broken on Windows (miniaudio), but its
RAOP sender is solid — so we monkey-patch `raop.open_source` to feed raw PCM
directly. See GUIDANCE.md §4/§6.
"""

from __future__ import annotations

import array
import asyncio
import logging

import pyatv.protocols.raop as raop_mod
from pyatv.interface import DeviceListener
from pyatv.protocols.raop.audio_source import AudioSource, _to_audio_samples
from pyatv.interface import MediaMetadata
from pyatv.support.rtsp import RtspSession

from audio_capture import create_capture
from connection import local_sender_name
from resample import ratecv

log = logging.getLogger("focalsonic.airplay.streamer")

RAOP_RATE = 44100
RAOP_CHANNELS = 2
RAOP_SAMPLE_SIZE = 2  # bytes (s16)

# Drop-oldest queue: a few hundred ms of jitter headroom, no unbounded latency.
QUEUE_MAXSIZE = 12

# Now-playing metadata sent to the receiver.
DEFAULT_METADATA = MediaMetadata(
    title="FocalSonic",
    artist="FocalSonic",
    album="AirPlay",
    duration=0.0,
)


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
    if not callable(getattr(RtspSession, "setup", None)):
        missing.append("pyatv.support.rtsp.RtspSession.setup")
    if missing:
        raise StartupSymbolError(
            "pyatv internals required for live PCM streaming are missing: "
            + ", ".join(missing)
            + ". Pin pyatv and re-validate the monkey-patch."
        )


class _ConnectionListener(DeviceListener):
    """pyatv fires these when the device drops us — either an intentional close
    or an unexpected network-level loss. We just flag it; the stream loop reacts.

    pyatv holds the listener via a weakref, so the streamer keeps a strong
    reference (``self._listener``) to stop this being garbage-collected.
    """

    def __init__(self, on_disconnect):
        self._on_disconnect = on_disconnect

    def connection_lost(self, exception: Exception) -> None:
        log.warning("Device connection lost: %s", exception)
        self._on_disconnect()

    def connection_closed(self) -> None:
        log.info("Device closed the connection")
        self._on_disconnect()


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
        return DEFAULT_METADATA

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

        self._queue: asyncio.Queue = asyncio.Queue(maxsize=QUEUE_MAXSIZE)
        # Which process the audio comes out of, and how to tap it, is platform-specific.
        self._capture = create_capture(host_pid, sample_rate=capture_rate,
                                       channels=RAOP_CHANNELS)
        self._ratecv_state = None
        self._atv = None
        self._listener = None  # strong ref; pyatv stores listeners weakly

        # Audio-level diagnostics (silence vs flowing).
        self._diag_chunks = 0
        self._diag_raw_peak = 0.0
        self._diag_out_peak = 0.0

    # -- audio conversion (runs on the capture thread) ---------------------

    def _process_chunk(self, float_bytes: bytes) -> bytes:
        """float32 -> restore gain -> int16 -> resample to 44.1k.

        Pure stdlib (no numpy): the ``array`` module parses the float32 capture
        buffer and we fold gain + clip + int16 cast into a single pass. Every
        platform we capture on is little-endian, so ``array``'s native byte order
        matches the capture's ``<f4`` floats and the ``<i2`` output pyatv expects.
        """
        samples = array.array("f")
        samples.frombytes(float_bytes)
        if not samples:
            self._log_levels(0.0, 0.0)
            return b""

        # abs-peak = max(|x|) = max(max(x), -min(x)); min/max run at C speed.
        raw_peak = max(max(samples), -min(samples))
        # gain_restore is a positive scalar, so post-gain abs-peak scales linearly.
        out_peak = raw_peak * self.gain_restore if self.gain_restore != 1.0 else raw_peak

        # Equivalent to numpy's clip(arr,-1,1) * 32767 then truncate-toward-zero:
        # clamp the scaled product to +/-32767 and int() (which truncates like astype).
        scale = self.gain_restore * 32767.0
        i16 = array.array("h", (
            32767 if (v := x * scale) > 32767.0
            else -32767 if v < -32767.0
            else int(v)
            for x in samples
        )).tobytes()

        self._log_levels(raw_peak, out_peak)

        if self.capture_rate != RAOP_RATE:
            i16, self._ratecv_state = ratecv(
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
        """Capture + stream until the device drops us or we're cancelled.

        We race pyatv's ``stream_file`` against a disconnect signal from the
        device listener: a clean ``stream_file`` return ends the session, a
        device disconnect (incl. a silent network drop the listener catches)
        cancels it, and a streaming exception is re-raised so ``run()`` can
        re-pair on an auth failure (HTTP 470).
        """
        self._atv = atv
        source = LivePCMSource(self._queue)

        async def _patched_open_source(file, sample_rate, channels, sample_size):
            return source

        original_open_source = raop_mod.open_source
        raop_mod.open_source = _patched_open_source

        # The AirPlay v2 RAOP setup hardcodes {"name": "pyatv"} in its SETUP body
        # (raop/protocols/airplayv2.py) — that's the source name the receiver shows.
        # It ignores pyatv's settings, so rewrite it on the way out. Only that one
        # setup carries a "name" key (the audio-stream setup sends {"streams": …}
        # and v1 sends Transport headers), so this touches nothing else.
        original_rtsp_setup = RtspSession.setup
        sender_name = local_sender_name()

        async def _patched_rtsp_setup(self, headers=None, body=None):
            if isinstance(body, dict) and "name" in body:
                body = {**body, "name": sender_name}
            return await original_rtsp_setup(self, headers=headers, body=body)

        RtspSession.setup = _patched_rtsp_setup

        # Exit promptly if the device goes away instead of streaming into the void.
        disconnected = asyncio.Event()
        self._listener = _ConnectionListener(
            lambda: self.loop.call_soon_threadsafe(disconnected.set)
        )
        atv.listener = self._listener

        # Start capture only now, right before pyatv consumes, so audio doesn't pile up.
        self._capture.start(self._on_capture_chunk)
        stream_task = self.loop.create_task(atv.stream.stream_file("live"))  # arg ignored
        disconnect_task = self.loop.create_task(disconnected.wait())
        try:
            await asyncio.wait(
                {stream_task, disconnect_task}, return_when=asyncio.FIRST_COMPLETED,
            )
            if disconnect_task.done() and not stream_task.done():
                log.info("Device disconnected — ending stream")
            elif stream_task.done():
                stream_task.result()  # re-raise a streaming error (e.g. RAOP 470)
        finally:
            for task in (stream_task, disconnect_task):
                if not task.done():
                    task.cancel()
            await asyncio.gather(stream_task, disconnect_task, return_exceptions=True)
            raop_mod.open_source = original_open_source
            RtspSession.setup = original_rtsp_setup
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
