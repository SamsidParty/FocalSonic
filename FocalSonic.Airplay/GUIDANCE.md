# Clean-Room Implementation Guide — Windows System Audio → Apple TV (AirPlay) via pyatv

This document captures everything learned building a working proof-of-concept so a production
version can be implemented from scratch. Target: capture Windows system audio (what the user
hears) and stream it live to an Apple TV over AirPlay, using **pyatv** for the AirPlay protocol.

> Verified working against: **Apple TV 4K (gen 3), tvOS 26.5**, from Windows 11, Python 3.12.

---

## 1. High-level architecture

```
WASAPI loopback (default output device)        pyatv (AirPlay/RAOP sender)
   pyaudiowpatch  ──► resample 48k→44.1k ──►  custom AudioSource ──► Apple TV
                      (audioop.ratecv)         (bypasses miniaudio)
```

Four pieces:
1. **Capture** the *default output device's* WASAPI loopback (the audio actually being played).
2. **Resample** to 44.1 kHz / 16-bit / stereo (AirPlay's expected format).
3. **Feed** the PCM into pyatv via a **custom `AudioSource`** (NOT pyatv's file/HTTP streaming).
4. pyatv handles pairing, encryption, RTP/RAOP, PTP timing, and transmission.

No ffmpeg. No native binaries beyond Python wheels (`pyatv` bundles `miniaudio`; `pyaudiowpatch`
is a PyAudio fork). Everything ships as pip packages.

---

## 2. Dependencies

```
pip install pyatv pyaudiowpatch
```
- `pyatv` — AirPlay protocol (pairing, RAOP streaming, encryption, PTP). Pulls in aiohttp,
  cryptography, miniaudio, etc. All pure wheels.
- `pyaudiowpatch` — PyAudio fork that adds **WASAPI loopback** capture on Windows (vanilla
  PyAudio cannot capture system output). Stdlib `audioop` does the resampling.

Python 3.12. (Note `audioop` is deprecated and removed in 3.13 — for 3.13+ vendor a tiny
`ratecv` replacement or use `numpy`/`soxr`/`samplerate`.)

---

## 3. Pairing (one-time)

Apple TV requires HomeKit pairing for AirPlay (`Pairing: Mandatory`). pyatv handles the whole
HAP/SRP/Ed25519 flow; you just relay the on-screen PIN.

```python
atvs = await pyatv.scan(loop, identifier=DEVICE_ID, timeout=8)
pairing = await pyatv.pair(atvs[0], Protocol.AirPlay, loop)
await pairing.begin()          # PIN appears on the TV
pairing.pin(user_entered_pin)  # 4 digits
await pairing.finish()
creds = atvs[0].get_service(Protocol.AirPlay).credentials  # persist this string
```
Persist `creds` (an opaque string). On every subsequent run, set it back before connecting:
```python
config.get_service(Protocol.AirPlay).credentials = creds
```
Credentials survive reboots; re-pair only if the device is reset/unpaired.

`Allow Access` on the Apple TV should permit the sender ("Everyone" or "Anyone on the Same
Network"). With a paired credential this generally works regardless.

---

## 4. THE KEY INSIGHT: bypass pyatv's audio decoding with a custom `AudioSource`

`atv.stream.stream_file(path_or_url)` is pyatv's public API. It internally calls
`open_source()` which decodes the input with **miniaudio**. Two facts learned the hard way:

- **pyatv streams a local *file* perfectly** (decodes whole file, plays — audible).
- **pyatv's *live/streaming* paths are broken on Windows** (at least with the bundled
  miniaudio):
  - File-like / pipe / `asyncio.StreamReader` source → truncates after ~1 second
    (miniaudio's streaming reader returns false EOF / honors a finite-looking read).
  - HTTP / `InternetSource` (IceCast) source → `miniaudio.DecodeError: failed to init
    decoder` for *any* format (mp3, wav).

But pyatv's **RAOP sender itself is solid** (the file path proves it). So the fix is to feed it
raw PCM directly and skip miniaudio entirely.

`stream_file()` calls the module-level `open_source` in `pyatv.protocols.raop`. Monkey-patch it
to return a custom `AudioSource`:

```python
import pyatv.protocols.raop as raop_mod
from pyatv.protocols.raop.audio_source import AudioSource, _to_audio_samples
from pyatv.support.metadata import EMPTY_METADATA

class LivePCMSource(AudioSource):
    def __init__(self, queue, rate, ch, size):
        self._q, self._rate, self._ch, self._size = queue, rate, ch, size
        self._buf = bytearray(); self._ended = False
    async def readframes(self, nframes):
        need = nframes * self._size * self._ch
        while len(self._buf) < need and not self._ended:
            chunk = await self._q.get()
            if chunk is None: self._ended = True; break
            self._buf.extend(chunk)
        if not self._buf: return AudioSource.NO_FRAMES
        out = bytes(self._buf[:need]); del self._buf[:need]
        return _to_audio_samples(out)        # native s16 -> big-endian (what RAOP expects)
    async def get_metadata(self): return EMPTY_METADATA
    @property
    def sample_rate(self): return self._rate
    @property
    def channels(self): return self._ch
    @property
    def sample_size(self): return self._size
    @property
    def duration(self): return 0
    async def close(self): pass

async def _patched_open_source(file, sample_rate, channels, sample_size):
    return LivePCMSource(QUEUE, sample_rate, channels, sample_size)
raop_mod.open_source = _patched_open_source

# then just:
await atv.stream.stream_file("live")   # arg ignored; our source is used
```

**Format contract for `readframes`:** return `_to_audio_samples(native_int16_LE_pcm)`. That
helper assumes s16 and byteswaps to big-endian on little-endian hosts (what the RAOP packetizer
expects). Context is **44100 Hz / 2 ch / 2 bytes** (passed into `open_source`).

**Fragility note (important for production):** this relies on the internal name
`pyatv.protocols.raop.open_source` and the `AudioSource`/`_to_audio_samples` internals
(`stream_file` is even marked "INCUBATING — MIGHT CHANGE"). Pin the pyatv version, and add a
startup self-check that these symbols exist; fail loudly with a clear message if a pyatv upgrade
moves them. Consider upstreaming a proper "stream raw PCM" API to pyatv to remove the patch.

---

## 5. Capturing system audio (WASAPI loopback)

Pitfalls, in order of how much time they cost:

1. **Use the DEFAULT OUTPUT device's loopback — not "Stereo Mix".** "Stereo Mix" only taps the
   Realtek onboard output; if the user listens on a USB/Bluetooth/wireless headset, Stereo Mix
   captures **silence**. Resolve the default render device, then find its loopback companion:
   ```python
   import pyaudiowpatch as pa
   p = pa.PyAudio()
   wasapi = p.get_host_api_info_by_type(pa.paWASAPI)
   default_out = p.get_device_info_by_index(wasapi["defaultOutputDevice"])
   dev = next(d for d in p.get_loopback_device_info_generator()
              if default_out["name"] in d["name"])
   ```
2. **Open the loopback stream as `paInt16`.** Reading it as `paFloat32` returned silence in
   testing; `paInt16` works (PortAudio/WASAPI shared-mode does the conversion).
3. **Loopback runs at the device mix rate (commonly 48000 Hz)** → resample to 44100 with
   `audioop.ratecv(data, 2, channels, in_rate, 44100, state)` (carry `state` across calls).
4. **Exclusive-mode players capture as silence.** WASAPI loopback only sees the *shared* mixer;
   an app holding the device in exclusive mode bypasses it. Most apps (browsers, Spotify) use
   shared mode. Document this; optionally detect prolonged silence and warn.
5. Handle the **default device changing** at runtime (user switches output): detect and restart
   the capture stream on the new device.

Capture runs in a **background thread** (PyAudio is blocking); hand PCM to the asyncio side via
`loop.call_soon_threadsafe` (see latency section for the queue policy).

---

## 6. Latency — the single most important production concern

**AirPlay's inherent latency floor is ~1.5–2 s.** pyatv hardcodes the RAOP buffer at
`latency = 22050 + sample_rate` frames (= 66150 @ 44.1 kHz ≈ **1.5 s**) in
`pyatv/protocols/raop/protocols/__init__.py` (`StreamContext`). The receiver schedules playback
that far ahead for multi-room sync; this is fundamental to AirPlay, not a bug. ~2 s end-to-end
is about the realistic best case.

**Everything above ~2 s is self-inflicted buffering.** The PoC hit 10 s+ because:
- Capture started **before** pyatv's 8 s `scan()` + connect, so ~10 s of audio piled into the
  queue before playback began, and pyatv then played from the *oldest* sample.
- The queue was huge (`maxsize=200` ≈ 8.5 s) and used **blocking back-pressure** (drop nothing),
  so any drift accumulated permanently.

**Rules for low latency:**
1. **Start capture only after pyatv is connected and about to consume** (right before
   `stream_file`). Don't let audio accumulate during scan/connect.
2. **Tiny bounded buffer with DROP-OLDEST**, never block-and-accumulate. For live audio, dropping
   stale samples to stay near "now" is correct; growing latency is not. Example:
   ```python
   def put_drop_oldest(loop, q, data):
       def _put():
           if q.full():
               try: q.get_nowait()
               except asyncio.QueueEmpty: pass
           q.put_nowait(data)
       loop.call_soon_threadsafe(_put)
   ```
   Size the queue for ~150–300 ms of jitter headroom (a handful of capture chunks), no more.
3. **Optionally lower pyatv's RAOP latency.** Patching `StreamContext.latency` down (e.g. to
   `sample_rate` = 1 s, or `sample_rate//2` = 0.5 s) reduces the floor, but too low risks the
   receiver dropping "late" packets and causing stutter. Tune empirically per network; keep a
   safe default (~1 s) and expose it as a setting. This is an internal-attribute patch — same
   fragility caveat as §4.
4. Keep capture chunk size modest (~1024–2048 frames ≈ 20–45 ms) — small enough for low latency,
   large enough to avoid overhead/underruns.

Realistic target after these fixes: **~1.5–2.5 s**, dominated by AirPlay's inherent buffer.

---

## 7. Production hardening checklist

- **Device discovery / selection:** scan once, let the user pick (or remember last device by
  identifier). Avoid re-scanning on every start (slow); connect by stored identifier.
- **Connection lifecycle:** `stream_file` blocks for the session. Wrap in supervise/restart with
  backoff. Handle the TV going to sleep, network drops, and `pyatv` exceptions.
- **Reconnect** automatically; re-establish capture + stream.
- **Default-device change** (user switches headset/speakers) → restart capture on the new device.
- **Volume:** AirPlay volume is separate from Windows volume; optionally expose set-volume via
  `atv.audio.set_volume()`.
- **Silence detection:** if loopback is silent for a while, surface a hint (wrong device /
  exclusive-mode app).
- **Pin pyatv & pyaudiowpatch versions**; add the symbol self-check from §4. Re-validate on every
  dependency bump (the monkey-patch points are internal/incubating).
- **Channels:** loopback is usually stereo; if a device reports >2 channels, downmix before send.
- **Shutdown:** stop capture thread, `await atv.close()` (returns a *set of tasks* — await each,
  it is NOT a coroutine), terminate PyAudio.
- **Packaging:** PyInstaller-friendly; no external binaries. `pyaudiowpatch` ships PortAudio.

---

## 8. Dead ends (do NOT repeat)

- `atvremote stream_file=<pipe>` / passing a pipe or `StreamReader` → truncates at ~1 s.
- `stream_file=<http url>` (mp3 or wav, via ffmpeg `-listen` or aiohttp) → miniaudio
  `failed to init decoder`. The continuous/InternetSource path does not work here.
- "Stereo Mix" capture → silence when output isn't the Realtek device.
- ffmpeg for capture/encode → unnecessary and large; `pyaudiowpatch` + `audioop` replace it.
- A full from-scratch C# AirPlay-2 sender → got pairing, encryption, PTP, RTSP, RECORD all
  working, but audible playback needs a subtle timing/anchor detail that wasn't cracked. pyatv
  already solves all of this; don't reimplement it.
