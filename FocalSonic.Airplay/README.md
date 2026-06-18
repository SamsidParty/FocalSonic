# FocalSonic.Airplay

The AirPlay streaming engine for FocalSonic. It is written in Python and shipped
as a **single, self-contained Windows executable** (compiled with
[Nuitka](https://nuitka.net) — no system Python or pip dependencies required on
the user's machine). The FocalSonic C# host spawns it **once the user picks an
Apple TV / HomePod**. It captures FocalSonic's per-process audio on Windows and
streams it to the device over AirPlay (RAOP) using [pyatv](https://pyatv.dev).

Discovery and device selection happen on the C# / TypeScript side (Bonjour via
Zeroconf). This module only does the heavy lifting: **pairing, PIN entry,
per-process audio capture, and streaming**.

The PIN entry dialog (tkinter) runs as a short-lived child process of the *same*
executable, launched via the `--pin-dialog` switch — tkinter needs a real process
main thread, so it can't share the streaming process's event loop.

See [`GUIDANCE.md`](./GUIDANCE.md) for the deep research this is built on.

## Design contract

- The **only** input from the host is command-line arguments — no IPC, no stdin
  protocol. This keeps the host integration trivial.
- The host treats **process exit (any reason) as a disconnect**. To stop AirPlay,
  the host kills this process.
- The module owns its own pairing-credential store
  (`%APPDATA%/FocalSonic/airplay/credentials.json`), keyed by device identifier.
  Credentials survive reboots; the module only re-pairs if the device was reset.

## How the audio path works

FocalSonic drops its playback gain to ~`1e-6` (near silence) while AirPlay is
active so nothing audible comes out of the PC speakers. We capture that near
silent signal from FocalSonic's **process tree** using the Windows Process
Loopback API — in **32-bit float**, which preserves the tiny signal losslessly —
then multiply it back up by `1e6` before streaming. int16 capture would quantize
a `1e-6` signal to zero, which is why float capture is mandatory.

```
ProcessLoopbackCapture(host_pid, float32, 48 kHz)   # captures FocalSonic.exe + WebView2 children
  -> x 1e6 (restore)  ->  clip + int16  ->  resample 48k->44.1k  ->  pyatv RAOP  ->  device
```

`pyatv`'s public live-streaming paths are broken on Windows, so we monkey-patch
`pyatv.protocols.raop.open_source` to feed raw PCM straight into the (solid) RAOP
sender. `streamer.verify_pyatv_symbols()` fails loudly if a pyatv upgrade moves
those internals.

## Layout

All modules live flat in this folder (no package); `airplay.py` is the entry
point that Nuitka compiles:

| File                 | Role                                                      |
|----------------------|-----------------------------------------------------------|
| `airplay.py`         | Entry point + arg parsing; dispatches the `--pin-dialog` mode. |
| `connection.py`      | pyatv scan / connect / credential application.            |
| `pairing.py`         | HAP pairing; launches the PIN dialog subprocess.          |
| `pin_dialog.py`      | The tkinter PIN dialog (`run_dialog`).                    |
| `credentials.py`     | Per-device credential persistence.                        |
| `streamer.py`        | Capture → resample → RAOP pipeline + pyatv monkey-patch.  |
| `process_capture.py` | Windows process-loopback (WASAPI) capture via raw COM.    |
| `process_finder.py`  | Finds the WebView2 process tree to capture.               |

## Building

Run the one-click build script — it sets up an isolated venv, installs the
dependencies + Nuitka, and drops a signed-ready single exe into the matching
IgniteView native runtime folder so the FocalSonic build bundles it:

```
FocalSonic.Airplay\build-airplay.bat
```

Output: `..\FocalSonic\iv2runtime\win-<arch>\native\focalsonic-airplay.exe`.

Nuitka does **not** cross-compile: the script builds for the architecture of the
Python interpreter it runs under (run it on an x64 box for `win-x64`, an ARM64 box
for `win-arm64`).

### Official (signed) builds

The exes are **committed** to the repo under `iv2runtime\win-<arch>\native\`, so the
MSIX build just bundles them — it doesn't recompile on every push (a Nuitka build is
~15 min/arch). To refresh them, run the **Build AirPlay Module** workflow manually
(Actions tab → Run workflow, on the branch you want). It compiles x64 + arm64 on
their native runners, Authenticode-signs both as *SamsidParty* (the same certificate
as `FocalSonic.exe`), and commits the executables back to that branch. Triggering is
restricted to the canonical repo, so forks can't run it with the signing certificate.

Use `build-airplay.bat` for **local testing**; let the workflow produce the signed
artifacts that ship.

### Build requirements

- **Python 3.12** (`audioop`, used for resampling, was removed in 3.13).
- A C compiler. With Visual Studio Build Tools present Nuitka uses MSVC; otherwise
  it auto-downloads MinGW64 (x64 only).
- `favicon.ico` (in this folder) is embedded as the exe icon.

## Usage

The host spawns the compiled exe with command-line args (no IPC). To run the
**uncompiled** module directly while developing, first
`pip install -r requirements.txt`, then:

```
python airplay.py --host-pid <FocalSonic.exe PID> \
    --address 192.168.1.42 --identifier AA:BB:CC:DD:EE:FF --name "Living Room"
```

| Argument         | Purpose                                                          |
|------------------|------------------------------------------------------------------|
| `--host-pid`     | PID of `FocalSonic.exe`; its whole process tree is captured.     |
| `--address`      | Device IP for a fast targeted scan.                              |
| `--identifier`   | AirPlay deviceid (MAC); used for creds + verification.          |
| `--name`         | Friendly name shown in the pairing dialog.                      |
| `--capture-rate` | WASAPI capture rate (default 48000, resampled to 44100).        |
| `--gain-restore` | Multiplier undoing the host's mute (default `1e6`).            |
| `--repair`       | Ignore stored credentials and force re-pairing.                 |
| `--data-dir`     | Host data dir; creds + `airplay.log` go under `<data-dir>/Airplay`. |
| `--pin-dialog`   | Internal: show the PIN dialog for `NAME` and print the PIN.      |

Exit codes: `0` clean end, `2` bad args, `3` pairing failed, `4` device not
found, `5` capture/stream error. The host treats them all as "disconnected".

It also runs on **Windows 10 build 19041+** only (the process-loopback
activation type the capture relies on).
