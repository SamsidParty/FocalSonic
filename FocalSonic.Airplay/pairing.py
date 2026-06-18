"""
AirPlay pairing: pyatv drives the HAP/SRP/Ed25519 flow; we relay the on-screen
PIN, collected via a tkinter dialog run in its own process (tkinter needs a real
process main thread; running it on a worker thread here is unreliable).
"""

from __future__ import annotations

import asyncio
import logging
import os
import sys

# pyatv is imported lazily inside the pairing coroutines so that the module — and
# the lightweight --pin-dialog path that re-imports it — load without pyatv present.

log = logging.getLogger("focalsonic.airplay.pairing")

# Flag understood by airplay.main(): show the PIN dialog and print the PIN.
PIN_DIALOG_FLAG = "--pin-dialog"


def _pin_dialog_command(device_name: str) -> list[str]:
    """Argv that runs the PIN dialog as a separate process.

    Relaunch via ``sys.argv[0]`` (the real program path), NOT ``sys.executable``:
    in a Nuitka *onefile* build ``sys.executable`` is a throwaway ``python.exe``
    inside the unpacked temp dir — not launchable, and there is no ``airplay.py``
    on disk. ``sys.argv[0]`` is the actual binary (compiled) or script (source) in
    both cases (verified against Nuitka 4.1.2 onefile, where NUITKA_ONEFILE_BINARY
    is unset). Getting this wrong is what made the dialog never appear.
    """
    program = os.path.abspath(sys.argv[0])
    if program.lower().endswith(".py"):
        # Running from source: python airplay.py --pin-dialog NAME
        return [sys.executable, program, PIN_DIALOG_FLAG, device_name]
    # Compiled exe (onefile/standalone): focalsonic-airplay.exe --pin-dialog NAME
    return [program, PIN_DIALOG_FLAG, device_name]


async def ask_pin(loop: asyncio.AbstractEventLoop, device_name: str) -> str | None:
    """Collect the PIN by running the dialog in a subprocess and reading its stdout."""
    cmd = _pin_dialog_command(device_name)
    log.info("Launching PIN dialog: %s", " ".join(cmd))
    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await proc.communicate()
    except Exception as exc:  # noqa: BLE001
        log.error("Failed to launch PIN dialog: %s", exc)
        return None

    if proc.returncode == 0:
        pin = stdout.decode(errors="replace").strip()
        return pin or None

    if stderr:
        log.debug("PIN dialog stderr: %s", stderr.decode(errors="replace").strip())
    log.info("PIN entry cancelled")
    return None


async def pair_device(loop: asyncio.AbstractEventLoop, config, device_name: str) -> str:
    """Run interactive pairing; return the credentials string, or raise on failure."""
    from pyatv.const import Protocol

    pairing = await pyatv_pair(config, loop)
    try:
        try:
            await pairing.begin()  # PIN now appears on the device
        except KeyError as exc:
            # pyatv reads Salt/PublicKey out of the device's pair-setup response; a
            # KeyError here means the response had neither (the device sent an error
            # TLV instead). Could be rate-limiting after repeated attempts, a busy/
            # already-pairing device, or a protocol mismatch. Surface something
            # readable instead of the bare "<TlvValue.Salt: 2>"; the DEBUG log has the
            # device's actual response.
            raise RuntimeError(
                f"device's pair-setup response was missing {exc} — it returned an "
                "error instead of starting pairing. Re-run with --log-level DEBUG to "
                "see the device's response (rate-limited / busy / protocol mismatch)."
            ) from exc

        if pairing.device_provides_pin:
            pin = await ask_pin(loop, device_name)
            if not pin:
                raise RuntimeError("Pairing cancelled by user")
            pairing.pin(pin)
        else:
            # Some devices want us to display a PIN instead; unusual for AirPlay.
            pairing.pin(1234)

        await pairing.finish()
        if not pairing.has_paired:
            raise RuntimeError("Pairing did not complete")

        service = config.get_service(Protocol.AirPlay)
        credentials = service.credentials
        if not credentials:
            raise RuntimeError("Pairing finished but no credentials were returned")
        return credentials
    finally:
        await pairing.close()


async def pyatv_pair(config, loop):
    import pyatv
    from pyatv.const import Protocol
    return await pyatv.pair(config, Protocol.AirPlay, loop)
