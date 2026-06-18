"""
FocalSonic AirPlay module — entry point.

Spawned by the C# host once a device is picked; the only input is command-line
args and the host treats process exit (any reason) as a disconnect. Scans, pairs
(PIN dialog) if needed, then captures FocalSonic's WebView2 audio and streams it.

Exit codes (all mean "disconnected" to the host; they just aid logging):
  0 clean end · 2 bad args · 3 pairing failed · 4 device not found · 5 stream error
"""

from __future__ import annotations

import argparse
import asyncio
import logging
import signal
import sys

from . import connection, credentials
from .pairing import pair_device
from .streamer import AirPlayStreamer, StartupSymbolError, verify_pyatv_symbols

log = logging.getLogger("focalsonic.airplay")


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


def main(argv=None) -> int:
    argv = sys.argv[1:] if argv is None else argv
    args = parse_args(argv)

    # Point the credential/log store at the host's data folder before logging starts.
    credentials.set_data_dir(args.data_dir)

    level = getattr(logging, str(args.log_level).upper(), logging.INFO)
    handlers: list[logging.Handler] = [logging.StreamHandler(sys.stderr)]
    # Also log to a file — the host runs us with no visible console.
    try:
        from . import credentials as _creds
        log_path = _creds._store_dir() / "airplay.log"
        handlers.append(logging.FileHandler(log_path, mode="w", encoding="utf-8"))
    except Exception:  # noqa: BLE001
        pass
    logging.basicConfig(
        level=level,
        format="[%(levelname)s] %(name)s: %(message)s",
        handlers=handlers,
    )

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
