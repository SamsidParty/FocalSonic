"""
Per-application audio capture on Linux (PipeWire / PulseAudio).

The Linux counterpart to ``process_capture.ProcessLoopbackCapture``, with the same
goal: capture FocalSonic's *own* audio rather than the system mix, so nothing else
playing on the machine ends up on the AirPlay receiver.

FocalSonic plays through two different paths: SoundFlowAudioPlayer renders natively
inside the host process, while AppleMusicAudioPlayer plays in the page — and, like
WebView2 on Windows, QtWebEngine puts that audio in a separate
``--utility-sub-type=audio.mojom.AudioService`` child rather than the host process.
So instead of assuming one of them, we look for playback streams owned by *any*
process in the host's tree (which covers both) and tap the one carrying audio.

Two taps, tried in order, both non-destructive (local playback keeps flowing to
the speakers, inaudible thanks to FocalSonic's 1e-6 AirPlay mute, exactly as on
Windows — no null sink, no re-routing of the user's audio):

  * ``parec --monitor-stream=<sink-input>`` — PulseAudio protocol, so it works on
    real PulseAudio *and* through PipeWire's pulse server. Tried first for that
    reason.
  * ``pw-record --target=<node-serial>``    — PipeWire native, for PipeWire hosts
    that don't have pulseaudio-utils installed.

Both are asked for float32 directly, so the ~1e-6 mute survives the round trip
(int16 would quantise it to zero), and for the RAOP rate directly, so no
resampling is needed on this side.

The tap is supervised: QtWebEngine tears its playback stream down when nothing has
played for a while and opens a fresh one on the next song, so we re-resolve and
re-attach rather than going permanently silent after the first track.
"""

from __future__ import annotations

import json
import logging
import os
import re
import select
import shutil
import subprocess
import threading
import time

log = logging.getLogger("focalsonic.airplay.capture.linux")

# pactl/parec translate their output; we parse it, so pin the locale to C.
_C_LOCALE_ENV = {**os.environ, "LC_ALL": "C", "LANG": "C", "LANGUAGE": ""}

# How often the supervisor looks for a stream to attach to while idle.
_RESOLVE_INTERVAL = 0.25
# How often an attached tap re-checks that it's still on the right stream.
_RETARGET_INTERVAL = 3.0
# Emit silence once nothing real has arrived for this long, so AirPlay timing
# stays anchored to the wall clock (mirrors the Windows WAIT_TIMEOUT path).
_SILENCE_AFTER = 0.1
_PACER_INTERVAL = 0.05
# Cap a single silence burst so a long stall can't allocate an enormous buffer.
_MAX_SILENCE_SECONDS = 1.0
# Hold the pacer off for this long after attaching a tap: the helper's first
# delivery is retroactive (it covers the moment it started, buffer included), so
# pacing across that window would emit the same stretch of time twice.
_ATTACH_GRACE_SECONDS = 0.5
# With more than one candidate stream open, give a tap this long to produce a
# non-zero sample before moving on to the next candidate.
_SILENT_SWITCH_SECONDS = 3.0
# How long a stream that proved useless is skipped before it's considered again.
_BENCH_SECONDS = 10.0


class LinuxCaptureUnavailable(RuntimeError):
    """No usable audio-capture tooling on this machine."""


# ---------------------------------------------------------------------------
# Process tree
# ---------------------------------------------------------------------------

def _descendant_pids(host_pid: int) -> set[int]:
    """``host_pid`` plus every process below it, read from /proc."""
    children: dict[int, list[int]] = {}

    for entry in os.listdir("/proc"):
        if not entry.isdigit():
            continue
        try:
            with open(f"/proc/{entry}/stat", "rb") as handle:
                stat = handle.read()
        except OSError:
            continue  # exited between listdir and open — normal, just skip it

        # `pid (comm) state ppid ...` — comm is arbitrary and may contain spaces
        # or parens, so split *after* the last ')'.
        close = stat.rfind(b")")
        if close < 0:
            continue
        fields = stat[close + 1:].split()
        if len(fields) < 2:
            continue
        try:
            children.setdefault(int(fields[1]), []).append(int(entry))
        except ValueError:
            continue

    family = {host_pid}
    stack = [host_pid]
    while stack:
        for child in children.get(stack.pop(), ()):
            if child not in family:
                family.add(child)
                stack.append(child)
    return family


# ---------------------------------------------------------------------------
# Finding the app's playback stream
# ---------------------------------------------------------------------------

class PlaybackStream:
    """One playback stream of the app, addressable by either backend.

    ``index`` is the PulseAudio sink-input index (what ``parec --monitor-stream``
    wants) and ``serial`` is the PipeWire object serial (what ``pw-record
    --target`` wants). Whichever source found the stream may only know one of
    them, so both are optional and the backends skip streams they can't address.
    """

    __slots__ = ("index", "serial", "pid", "name", "active")

    def __init__(self, index=None, serial=None, pid=None, name="", active=True):
        self.index = index
        self.serial = serial
        self.pid = pid
        self.name = name
        self.active = active

    @property
    def key(self) -> tuple:
        """Identity used to notice that the app swapped to a different stream."""
        return (self.index, self.serial)

    def __str__(self) -> str:
        ident = f"sink-input {self.index}" if self.index is not None else f"node {self.serial}"
        return f"{self.name or 'stream'} ({ident}, pid {self.pid})"


def _run(cmd: list[str], timeout: float = 5.0) -> str | None:
    """Run a helper and return its stdout, or None if it isn't usable."""
    try:
        done = subprocess.run(cmd, env=_C_LOCALE_ENV, capture_output=True,
                              timeout=timeout, check=False)
    except (OSError, subprocess.SubprocessError) as exc:
        log.debug("%s failed: %s", cmd[0], exc)
        return None
    if done.returncode != 0:
        log.debug("%s exited %s: %s", cmd[0], done.returncode,
                  done.stderr.decode("utf-8", "replace").strip())
        return None
    return done.stdout.decode("utf-8", "replace")


_SINK_INPUT_HEADER = re.compile(r"^Sink Input #(\d+)")
_CORKED_LINE = re.compile(r"^\s+Corked:\s*(\S+)")
_PROPERTY_LINE = re.compile(r'^\s+([\w.\-]+) = "(.*)"\s*$')


def _streams_from_pactl() -> list[PlaybackStream] | None:
    """Playback streams as reported by ``pactl list sink-inputs``.

    None means pactl itself is unusable — as opposed to an empty list, which means
    it works and nothing is playing. The caller needs to tell those apart so it
    doesn't fall through to the much more expensive pw-dump on every poll while
    the user simply has nothing playing.
    """
    text = _run(["pactl", "list", "sink-inputs"])
    if text is None:
        return None

    streams: list[PlaybackStream] = []
    index: int | None = None
    props: dict[str, str] = {}
    corked = False

    def flush() -> None:
        if index is None:
            return
        try:
            pid = int(props.get("application.process.id", ""))
        except ValueError:
            pid = None
        try:
            serial = int(props.get("object.serial", ""))
        except ValueError:
            serial = None
        streams.append(PlaybackStream(
            index=index,
            serial=serial,
            pid=pid,
            name=props.get("application.name") or props.get("node.name") or "",
            active=not corked,
        ))

    for line in text.splitlines():
        header = _SINK_INPUT_HEADER.match(line)
        if header:
            flush()
            index = int(header.group(1))
            props = {}
            corked = False
            continue
        if index is None:
            continue
        cork = _CORKED_LINE.match(line)
        if cork:
            corked = cork.group(1).lower() == "yes"
            continue
        prop = _PROPERTY_LINE.match(line)
        if prop:
            props[prop.group(1)] = prop.group(2)
    flush()

    return streams


def _streams_from_pw_dump() -> list[PlaybackStream] | None:
    """Playback streams from ``pw-dump`` — the fallback for PipeWire hosts with no
    pulseaudio-utils, where ``pactl`` isn't available to enumerate them."""
    text = _run(["pw-dump"], timeout=8.0)
    if text is None:
        return None
    try:
        objects = json.loads(text)
    except ValueError:
        log.debug("pw-dump did not return JSON")
        return None

    streams: list[PlaybackStream] = []
    for obj in objects:
        if not isinstance(obj, dict) or obj.get("type") != "PipeWire:Interface:Node":
            continue
        info = obj.get("info") or {}
        props = info.get("props") or {}
        if props.get("media.class") != "Stream/Output/Audio":
            continue
        try:
            pid = int(props.get("application.process.id", ""))
        except (ValueError, TypeError):
            pid = None
        try:
            serial = int(props.get("object.serial", ""))
        except (ValueError, TypeError):
            serial = None
        streams.append(PlaybackStream(
            index=None,
            serial=serial,
            pid=pid,
            name=props.get("application.name") or props.get("node.name") or "",
            active=info.get("state") == "running",
        ))
    return streams


def find_playback_streams(host_pid: int) -> list[PlaybackStream]:
    """Every playback stream in FocalSonic's process tree, best candidate first.

    Both players can have a stream open at once — SoundFlow holds its output device
    open for the process lifetime — so this returns all of them and the capture
    picks by which one actually carries audio.
    """
    streams = _streams_from_pactl()
    if streams is None:
        streams = _streams_from_pw_dump()
    if not streams:
        return []

    family = _descendant_pids(host_pid)
    ours = [s for s in streams if s.pid in family]

    # Rank: playing before corked, then most recently created (indexes and serials
    # both increase monotonically) — that's the one a new song just opened.
    ours.sort(key=lambda s: (s.active, s.index if s.index is not None else -1,
                             s.serial if s.serial is not None else -1),
              reverse=True)
    return ours


def find_playback_stream(host_pid: int) -> PlaybackStream | None:
    """The best guess at FocalSonic's active playback stream, or None if it has
    none open right now (nothing has played for a while, so it closed it)."""
    streams = find_playback_streams(host_pid)
    return streams[0] if streams else None


# ---------------------------------------------------------------------------
# Capture backends
# ---------------------------------------------------------------------------

class _Backend:
    def __init__(self, name: str, binary: str, build):
        self.name = name
        self.binary = binary
        self._build = build

    def command(self, stream: PlaybackStream, rate: int, channels: int) -> list[str] | None:
        """Argv for tapping `stream`, or None if this backend can't address it."""
        return self._build(stream, rate, channels)


def _parec_command(stream: PlaybackStream, rate: int, channels: int) -> list[str] | None:
    if stream.index is None:
        return None
    return [
        "parec",
        f"--monitor-stream={stream.index}",
        "--format=float32le",
        f"--rate={rate}",
        f"--channels={channels}",
        "--latency-msec=20",
        "--client-name=FocalSonic AirPlay",
        "--stream-name=FocalSonic AirPlay capture",
    ]


def _pw_record_command(stream: PlaybackStream, rate: int, channels: int) -> list[str] | None:
    # --target takes a PipeWire object serial. A PulseAudio sink-input index is a
    # different namespace, so don't substitute it — it would tap the wrong stream.
    if stream.serial is None:
        return None
    return [
        "pw-record",
        f"--target={stream.serial}",
        "--format=f32",
        f"--rate={rate}",
        f"--channels={channels}",
        "--latency=20ms",
        "--raw",
        "-",
    ]


def available_backends() -> list[_Backend]:
    """Installed capture helpers, in preference order."""
    candidates = [
        _Backend("parec", "parec", _parec_command),
        _Backend("pw-record", "pw-record", _pw_record_command),
    ]
    return [b for b in candidates if shutil.which(b.binary)]


# ---------------------------------------------------------------------------
# Public capture class
# ---------------------------------------------------------------------------

class ApplicationAudioCapture:
    """
    Captures FocalSonic's audio as float32-LE interleaved frames at ``sample_rate``,
    re-attaching whenever the app tears a playback stream down and opens another.

    Same surface as ``ProcessLoopbackCapture``: ``start(on_chunk)`` / ``stop()``.
    """

    def __init__(self, host_pid: int, sample_rate: int = 44100, channels: int = 2):
        self.host_pid = int(host_pid)
        self.sample_rate = int(sample_rate)
        self.channels = int(channels)
        self.bytes_per_frame = channels * 4  # float32

        self._on_chunk = None
        self._stop = threading.Event()
        self._supervisor: threading.Thread | None = None
        self._pacer: threading.Thread | None = None

        self._proc: subprocess.Popen | None = None
        self._proc_lock = threading.Lock()
        self._residue = b""

        self._emit_lock = threading.Lock()
        self._last_emit = 0.0
        self._grace_until = 0.0
        # stream key -> when a tap last found it useless (silent, or untappable).
        self._benched: dict[tuple, float] = {}

    # -- lifecycle ---------------------------------------------------------

    def start(self, on_chunk) -> None:
        """Begin capturing.

        Unlike the Windows backend this does *not* require audio to already be
        playing: if the browser has no stream open yet we emit silence and attach
        as soon as one appears, so connecting to a receiver while paused works.
        Only missing tooling is fatal.
        """
        backends = available_backends()
        if not backends:
            raise LinuxCaptureUnavailable(
                "no audio capture helper found — install pulseaudio-utils (parec) "
                "or pipewire-utils (pw-record) to stream FocalSonic over AirPlay"
            )
        if not shutil.which("pactl") and not shutil.which("pw-dump"):
            raise LinuxCaptureUnavailable(
                "cannot enumerate audio streams — install pulseaudio-utils (pactl) "
                "or pipewire-utils (pw-dump)"
            )

        self._on_chunk = on_chunk
        self._stop.clear()
        self._residue = b""
        self._benched.clear()
        self._last_emit = time.monotonic()
        self._grace_until = 0.0

        log.info(
            "Starting Linux capture for host PID %s (%s Hz, %s ch, float32) via %s",
            self.host_pid, self.sample_rate, self.channels,
            ", ".join(b.name for b in backends),
        )

        self._supervisor = threading.Thread(target=self._supervise, args=(backends,),
                                            name="airplay-capture", daemon=True)
        self._pacer = threading.Thread(target=self._pace, name="airplay-capture-pacer",
                                       daemon=True)
        self._supervisor.start()
        self._pacer.start()

    def stop(self) -> None:
        self._stop.set()
        self._terminate_current()
        for thread in (self._supervisor, self._pacer):
            if thread is not None:
                thread.join(timeout=5)
        self._supervisor = None
        self._pacer = None

    # -- supervision -------------------------------------------------------

    def _supervise(self, backends: list[_Backend]) -> None:
        announced_wait = False
        while not self._stop.is_set():
            candidates = find_playback_streams(self.host_pid)
            stream = self._choose(candidates)
            if stream is None:
                if not announced_wait:
                    log.info("No playback stream open yet — waiting for audio")
                    announced_wait = True
                self._stop.wait(_RESOLVE_INTERVAL)
                continue

            announced_wait = False
            if not self._attach(stream, backends):
                # Nothing could tap it — bench it so a second candidate gets a turn
                # instead of us spinning on the same bad stream, and back off.
                self._benched[stream.key] = time.monotonic()
                self._stop.wait(1.0)

    def _choose(self, candidates: list[PlaybackStream]) -> PlaybackStream | None:
        """Best candidate, skipping any that recently proved to be pure silence.

        Both of FocalSonic's players can hold a stream open at the same time, and
        only one of them is making sound. Ranking can't tell them apart, so a tap
        that delivers nothing but digital silence (or that no backend could read at
        all) gets its stream benched for a while and we try the next one. When
        everything is benched we fall back to the top-ranked stream rather than
        capturing nothing.
        """
        if not candidates:
            return None
        now = time.monotonic()
        fresh = [c for c in candidates
                 if now - self._benched.get(c.key, -_BENCH_SECONDS) >= _BENCH_SECONDS]
        return (fresh or candidates)[0]

    def _attach(self, stream: PlaybackStream, backends: list[_Backend]) -> bool:
        """Tap `stream` until it ends. True if a backend managed to read from it."""
        for backend in backends:
            if self._stop.is_set():
                return True
            cmd = backend.command(stream, self.sample_rate, self.channels)
            if cmd is None:
                continue

            try:
                proc = subprocess.Popen(cmd, stdout=subprocess.PIPE,
                                        stderr=subprocess.PIPE, bufsize=0,
                                        env=_C_LOCALE_ENV)
            except OSError as exc:
                log.debug("Could not launch %s: %s", backend.name, exc)
                continue

            with self._proc_lock:
                self._proc = proc
            self._residue = b""
            with self._emit_lock:
                self._last_emit = time.monotonic()
                self._grace_until = self._last_emit + _ATTACH_GRACE_SECONDS
            log.info("Capturing %s with %s", stream, backend.name)

            threading.Thread(target=self._drain_stderr, args=(backend.name, proc),
                             daemon=True).start()
            try:
                read_any, saw_signal = self._pump(proc, stream)
            finally:
                self._terminate(proc)
                with self._proc_lock:
                    if self._proc is proc:
                        self._proc = None

            if read_any:
                if saw_signal:
                    self._benched.pop(stream.key, None)
                return True
            log.info("%s produced no audio for %s — trying the next backend",
                     backend.name, stream)
        return False

    def _pump(self, proc: subprocess.Popen, stream: PlaybackStream):
        """Read the tap until it ends.

        Returns ``(read_anything, saw_signal)``: the first says the backend worked,
        the second whether the stream carried more than digital silence.
        """
        read_size = self.bytes_per_frame * max(1, self.sample_rate // 50)  # ~20 ms
        stdout = proc.stdout
        total = 0
        saw_signal = False
        started = time.monotonic()
        last_check = started

        while not self._stop.is_set():
            try:
                ready, _, _ = select.select([stdout], [], [], 0.25)
            except (OSError, ValueError):
                break  # pipe closed underneath us

            if ready:
                try:
                    data = stdout.read(read_size)
                except (OSError, ValueError):
                    break
                if not data:
                    break  # EOF — the helper exited, usually because the stream went
                total += len(data)
                # strip() bails at the first non-zero byte, so this is cheap for real
                # audio and only scans in full while the stream is truly silent.
                if not saw_signal and data.strip(b"\x00"):
                    saw_signal = True
                self._emit_frames(data)
            elif proc.poll() is not None:
                break

            now = time.monotonic()
            if now - last_check >= _RETARGET_INTERVAL:
                last_check = now
                candidates = find_playback_streams(self.host_pid)
                keys = {c.key for c in candidates}
                if stream.key not in keys:
                    # The app closed this stream (end of a song, usually).
                    break
                # Silence here only means we're on the wrong stream if there's
                # another one to be on; with a single stream, staying put is right
                # (the user has simply paused).
                if (not saw_signal and len(candidates) > 1
                        and now - started >= _SILENT_SWITCH_SECONDS):
                    log.info("%s is silent and other streams are open — switching",
                             stream)
                    self._benched[stream.key] = now
                    break

        return total > 0, saw_signal

    def _drain_stderr(self, name: str, proc: subprocess.Popen) -> None:
        """Keep the helper's stderr from filling its pipe, and log what it says."""
        stream = proc.stderr
        if stream is None:
            return
        try:
            for line in iter(stream.readline, b""):
                text = line.decode("utf-8", "replace").strip()
                if text:
                    log.debug("%s: %s", name, text)
        except (OSError, ValueError):
            pass

    def _terminate_current(self) -> None:
        with self._proc_lock:
            proc = self._proc
            self._proc = None
        if proc is not None:
            self._terminate(proc)

    @staticmethod
    def _terminate(proc: subprocess.Popen) -> None:
        try:
            if proc.poll() is None:
                proc.terminate()
                try:
                    proc.wait(timeout=2)
                except subprocess.TimeoutExpired:
                    proc.kill()
                    proc.wait(timeout=2)
        except (OSError, subprocess.SubprocessError):
            pass
        for pipe in (proc.stdout, proc.stderr):
            try:
                if pipe is not None:
                    pipe.close()
            except OSError:
                pass

    # -- emission ----------------------------------------------------------

    def _emit_frames(self, data: bytes) -> None:
        """Emit whole frames only — a short pipe read can split one, and half a
        frame would both desync the channels and break the float32 unpacking."""
        if self._residue:
            data = self._residue + data
            self._residue = b""
        extra = len(data) % self.bytes_per_frame
        if extra:
            self._residue = data[-extra:]
            data = data[:-extra]
        if data:
            self._emit(data)

    def _emit(self, data: bytes) -> None:
        with self._emit_lock:
            self._last_emit = time.monotonic()
        callback = self._on_chunk
        if callback is not None:
            callback(data)

    def _pace(self) -> None:
        """Fill real-time gaps with silence.

        A tap delivers nothing at all while the app is paused or between streams,
        but RAOP is a real-time protocol — so whenever nothing has been emitted for
        a moment we emit exactly enough silence to cover the elapsed time. Sizing
        the burst from the measured gap (rather than a fixed chunk) keeps the
        stream anchored to the wall clock instead of slowly drifting.
        """
        while not self._stop.wait(_PACER_INTERVAL):
            now = time.monotonic()
            with self._emit_lock:
                if now < self._grace_until:
                    # A tap just attached; let its own first delivery cover this.
                    self._last_emit = now
                    continue
                gap = now - self._last_emit
                if gap < _SILENCE_AFTER:
                    continue
                self._last_emit = now

            frames = int(min(gap, _MAX_SILENCE_SECONDS) * self.sample_rate)
            if frames <= 0:
                continue
            callback = self._on_chunk
            if callback is not None:
                callback(b"\x00" * (frames * self.bytes_per_frame))


# ---------------------------------------------------------------------------
# Manual check: python linux_capture.py <focalsonic-pid> [seconds]
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import array
    import sys

    logging.basicConfig(level=logging.DEBUG, format="[%(levelname)s] %(name)s: %(message)s")

    host = int(sys.argv[1])
    seconds = float(sys.argv[2]) if len(sys.argv) > 2 else 5.0

    found = find_playback_stream(host)
    print(f"target: {found}")
    if found is None:
        raise SystemExit("no playback stream found for that process tree")

    totals = {"bytes": 0, "peak": 0.0}

    def _on_chunk(chunk: bytes) -> None:
        totals["bytes"] += len(chunk)
        samples = array.array("f")
        samples.frombytes(chunk)
        if samples:
            totals["peak"] = max(totals["peak"], max(samples), -min(samples))

    capture = ApplicationAudioCapture(host)
    capture.start(_on_chunk)
    time.sleep(seconds)
    capture.stop()

    frames = totals["bytes"] // capture.bytes_per_frame
    print(f"captured {frames} frames ({frames / capture.sample_rate:.2f}s of "
          f"{seconds:.2f}s wall clock), peak {totals['peak']:.6f}")
