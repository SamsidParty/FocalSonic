"""
AirPlay pairing: HomeKit PIN flow (pyatv) + a small tkinter PIN dialog.

Apple TV / HomePod require HomeKit pairing for AirPlay (Pairing: Mandatory).
pyatv drives the whole HAP/SRP/Ed25519 flow; we just relay the on-screen PIN.

The PIN is collected with tkinter (the C# host is intentionally not involved —
no IPC beyond command-line args). This runs the dialog on a worker thread so the
asyncio event loop driving pyatv keeps spinning.
"""

from __future__ import annotations

import asyncio
import logging
import os
import sys

from pyatv.const import Protocol

log = logging.getLogger("focalsonic.airplay.pairing")

# Absolute path to the dialog script — run by full path (NOT `-m`) so it resolves
# regardless of the host's working directory. pin_dialog.py only imports tkinter,
# so it needs no package context.
_PIN_DIALOG = os.path.join(os.path.dirname(os.path.abspath(__file__)), "pin_dialog.py")


async def ask_pin(loop: asyncio.AbstractEventLoop, device_name: str) -> str | None:
    """
    Collect the PIN by launching pin_dialog as a SEPARATE PROCESS.

    tkinter must run on a process main thread; doing it on a worker thread of this
    (already asyncio-driven, possibly C#-spawned) process is unreliable and the
    window can silently fail to appear. A subprocess gets its own clean main thread.
    """
    log.info("Launching PIN dialog: %s %s", sys.executable, _PIN_DIALOG)
    try:
        proc = await asyncio.create_subprocess_exec(
            sys.executable, _PIN_DIALOG, device_name,
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
    """
    Run the interactive pairing flow against a scanned `config`.

    Returns the resulting opaque credentials string. Raises on failure / cancel.
    """
    pairing = await pyatv_pair(config, loop)
    try:
        await pairing.begin()  # PIN now appears on the device

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
    return await pyatv.pair(config, Protocol.AirPlay, loop)
