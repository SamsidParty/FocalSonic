#!/usr/bin/env python
"""
FocalSonic AirPlay module — single-executable entry point.

In production this file is compiled by Nuitka into ``focalsonic-airplay.exe``
(see ``build-airplay.bat``). The FocalSonic C# host spawns it once the user picks
an Apple TV / HomePod; the only input is command-line arguments and the host
treats process exit (any reason) as a disconnect.

One binary, two modes:
  * (default)              scan, pair (PIN dialog if needed), capture + stream.
  * ``--pin-dialog NAME``  show the tkinter PIN dialog and print the PIN to stdout.
                           The pairing flow relaunches this same exe in this mode
                           as a subprocess, because tkinter needs a real process
                           main thread (running it on a worker thread is unreliable).

Exit codes (all mean "disconnected" to the host; they just aid logging):
  0 clean end · 2 bad args · 3 pairing failed · 4 device not found · 5 stream error
"""

from __future__ import annotations

import argparse
import asyncio
import logging
import signal
import socket
import sys

import credentials

# connection / pairing / streamer pull in pyatv + numpy; they're imported lazily
# inside run()/_try_connect() so the --pin-dialog subprocess (which only needs
# tkinter) starts without loading the whole audio stack.

__version__ = "1.0.0"

log = logging.getLogger("focalsonic.airplay")

# Subcommand the pairing flow relaunches us with to show the PIN dialog.
PIN_DIALOG_FLAG = "--pin-dialog"


def _nudge_firewall() -> "socket.socket | None":
    """Open a throwaway TCP listener so Windows shows its friendly *firewall*
    prompt ("…has blocked some features… Allow access") for this exe on first run.

    Why: RAOP needs the device to reach our inbound UDP timing/control ports, but
    Windows *silently drops* inbound UDP for an unknown program without ever
    prompting — so the user never gets a chance to allow it and the device's
    stream SETUP just times out. A TCP listen() reliably triggers the firewall
    dialog; clicking "Allow access" creates a program-scoped rule that then also
    covers our UDP ports. (This is the friendly firewall prompt, NOT a UAC
    elevation.) Bound to all interfaces — a loopback-only listener wouldn't prompt.

    Returns the socket, which the caller must keep referenced for the process
    lifetime. Best-effort: never let this block streaming.
    """
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.bind(("0.0.0.0", 0))
        sock.listen(1)
        log.info("Opened firewall-nudge listener on TCP port %d", sock.getsockname()[1])
        return sock
    except Exception as exc:  # noqa: BLE001
        log.debug("Firewall-nudge listener not opened: %s", exc)
        return None


def parse_args(argv) -> argparse.Namespace:
    p = argparse.ArgumentParser(prog="focalsonic-airplay", description="Stream FocalSonic audio to AirPlay")
    p.add_argument("--host-pid", type=int, required=True,
                   help="PID of FocalSonic.exe — its process tree is captured")
    p.add_argument("--identifier", default=None,
                   help="AirPlay device identifier (deviceid/MAC) used for creds + verification")
    p.add_argument("--address", default=None,
                   help="Device IP address for a targeted scan")
    p.add_argument("--name", default="AirPlay device",
                   help="Friendly device name (shown in the pairing dialog)")
    p.add_argument("--capture-rate", type=int, default=48000,
                   help="WASAPI capture sample rate (resampled to 44100 for RAOP)")
    p.add_argument("--gain-restore", type=float, default=1_000_000.0,
                   help="Multiplier that undoes FocalSonic's 1e-6 AirPlay mute (default 1e6)")
    p.add_argument("--repair", action="store_true",
                   help="Ignore stored credentials and force re-pairing")
    p.add_argument("--data-dir", default=None,
                   help="Host data directory; creds/logs go under <data-dir>/Airplay")
    p.add_argument("--log-level", default="INFO")
    args = p.parse_args(argv)
    if not args.identifier and not args.address:
        p.error("at least one of --identifier or --address is required")
    return args


def _credential_key(args) -> str:
    return args.identifier or args.address


def _is_auth_error(exc: Exception) -> bool:
    """True for device 'needs (re)pairing' errors — e.g. RAOP HTTP 470."""
    msg = str(exc).lower()
    return "470" in msg or "authorization required" in msg or "authentication" in msg


async def _try_connect(loop, args, config, creds):
    """Apply credentials and connect (with a timeout so a bad credential can't hang).

    Returns (atv, config) on success or (None, config) if the device rejected us.
    """
    import connection

    try:
        connection.apply_credentials(config, creds)
        log.info("Connecting…")
        # Short timeout: valid creds connect in ~1-3s; this only guards against a hang.
        atv = await asyncio.wait_for(connection.connect(loop, config), timeout=8)
        return atv, config
    except Exception as exc:  # noqa: BLE001
        log.info("Connect with stored credentials failed: %s", exc)
        return None, config


async def run(args: argparse.Namespace) -> int:
    import connection
    from pairing import pair_device
    from streamer import AirPlayStreamer, StartupSymbolError, verify_pyatv_symbols

    loop = asyncio.get_running_loop()

    try:
        verify_pyatv_symbols()
    except StartupSymbolError as exc:
        log.error("%s", exc)
        return 5

    log.info("Scanning for AirPlay device (address=%s, id=%s)…", args.address, args.identifier)
    config = await connection.scan_for_device(loop, args.address, args.identifier)
    if config is None:
        log.error("Device not found on the network")
        return 4
    if not connection.has_airplay_service(config):
        log.error("Device does not expose an AirPlay service")
        return 4

    log.info("Found device: %s", config.name)

    cred_key = _credential_key(args)
    creds = None if args.repair else credentials.get_credentials(cred_key)

    # Two passes: stored creds, then re-pair if rejected at connect or at RAOP
    # stream verification (HTTP 470). Re-pairing pops the PIN dialog.
    for _attempt in range(2):
        if not creds:
            log.info("Starting pairing — a PIN dialog will appear")
            config = await connection.scan_for_device(loop, args.address, args.identifier) or config
            if config is None:
                log.error("Device not found for pairing")
                return 4
            try:
                creds = await pair_device(loop, config, args.name)
            except Exception as exc:  # noqa: BLE001
                log.error("Pairing failed: %s", exc)
                return 3
            credentials.save_credentials(cred_key, creds)
            # Re-scan so the freshly-paired config is clean before connecting.
            config = await connection.scan_for_device(loop, args.address, args.identifier) or config

        atv, config = await _try_connect(loop, args, config, creds)
        if atv is None:
            log.info("Credentials rejected at connect — re-pairing")
            credentials.clear_credentials(cred_key)
            creds = None
            continue

        streamer = AirPlayStreamer(
            loop,
            host_pid=args.host_pid,
            capture_rate=args.capture_rate,
            gain_restore=args.gain_restore,
        )
        try:
            log.info("Streaming (capturing WebView2 audio of host PID %s)", args.host_pid)
            await streamer.stream(atv)
            log.info("Stream ended (device closed the connection)")
            return 0
        except asyncio.CancelledError:
            log.info("Streaming cancelled")
            return 0
        except Exception as exc:  # noqa: BLE001
            if _is_auth_error(exc) and not args.repair:
                log.info("Stream authorization failed (%s) — re-pairing", exc)
                credentials.clear_credentials(cred_key)
                creds = None
                continue  # retry the loop with a fresh pairing
            log.exception("Streaming error: %s", exc)
            return 5
        finally:
            streamer.stop()
            await connection.close_atv(atv)

    log.error("Could not establish an AirPlay session after re-pairing")
    return 3


def _configure_logging(level_name: str) -> None:
    level = getattr(logging, str(level_name).upper(), logging.INFO)

    handlers: list[logging.Handler] = []
    # We're built as a GUI-subsystem exe (no console), so sys.stderr is None unless
    # the host redirected it. Only attach the stream handler when it actually exists.
    if sys.stderr is not None:
        handlers.append(logging.StreamHandler(sys.stderr))
    # Always log to a file — the host runs us with no visible console.
    try:
        log_path = credentials._store_dir() / "airplay.log"
        handlers.append(logging.FileHandler(log_path, mode="w", encoding="utf-8"))
    except Exception:  # noqa: BLE001
        pass

    logging.basicConfig(
        level=level,
        format="[%(levelname)s] %(name)s: %(message)s",
        handlers=handlers,
    )


def main(argv=None) -> int:
    argv = sys.argv[1:] if argv is None else argv

    # PIN-dialog mode: a tiny GUI subprocess relaunched by the pairing flow.
    # Handle it before arg parsing / asyncio so it stays a self-contained path.
    if argv and argv[0] == PIN_DIALOG_FLAG:
        from pin_dialog import run_dialog
        device_name = argv[1] if len(argv) > 1 else "AirPlay device"
        return run_dialog(device_name)

    args = parse_args(argv)

    # Point the credential/log store at the host's data folder before logging starts.
    credentials.set_data_dir(args.data_dir)
    _configure_logging(args.log_level)

    # Open a TCP listener up front so Windows shows its firewall "Allow access"
    # prompt for this exe before RAOP needs inbound UDP. Held open for the whole
    # process (kept referenced); closed when we exit.
    _firewall_listener = _nudge_firewall()  # noqa: F841 - kept alive intentionally

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    main_task = loop.create_task(run(args))

    def _request_stop(*_):
        if not main_task.done():
            main_task.cancel()

    try:
        signal.signal(signal.SIGINT, _request_stop)
        if hasattr(signal, "SIGTERM"):
            signal.signal(signal.SIGTERM, _request_stop)
    except (ValueError, OSError):
        pass

    try:
        return loop.run_until_complete(main_task)
    except asyncio.CancelledError:
        return 0
    finally:
        try:
            loop.run_until_complete(loop.shutdown_asyncgens())
        except Exception:  # noqa: BLE001
            pass
        loop.close()


if __name__ == "__main__":
    sys.exit(main())
