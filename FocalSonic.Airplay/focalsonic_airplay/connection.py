"""
Device scan + connect helpers for AirPlay.

Discovery/selection happens C#-side (Zeroconf); here we do a targeted pyatv scan
by host (falling back to identifier) from the address/identifier args.
"""

from __future__ import annotations

import asyncio
import logging

import pyatv
from pyatv.const import Protocol

log = logging.getLogger("focalsonic.airplay.connection")

SCAN_TIMEOUT = 8


async def scan_for_device(loop, address: str | None, identifier: str | None):
    """Return a pyatv config for the requested device, or None if not found."""
    if address:
        results = await pyatv.scan(loop, hosts=[address], timeout=SCAN_TIMEOUT)
        if results:
            # When scanning by host we still verify the identifier if we have one.
            if identifier:
                for r in results:
                    if identifier in (r.all_identifiers or []):
                        return r
            return results[0]

    if identifier:
        results = await pyatv.scan(loop, identifier=identifier, timeout=SCAN_TIMEOUT)
        if results:
            return results[0]

    return None


def has_airplay_service(config) -> bool:
    return config.get_service(Protocol.AirPlay) is not None


def apply_credentials(config, credentials: str) -> None:
    airplay = config.get_service(Protocol.AirPlay)
    if airplay is None:
        raise RuntimeError("Device does not expose an AirPlay service")
    airplay.credentials = credentials

    # The RAOP (audio) stream verifies separately — without creds here it fails with
    # HTTP 470 even though the control connection authorized. Same pairing covers both.
    raop = config.get_service(Protocol.RAOP)
    if raop is not None:
        raop.credentials = credentials


async def connect(loop, config):
    return await pyatv.connect(config, loop)


async def close_atv(atv) -> None:
    """pyatv's close() returns a *set of pending tasks* — await each (not a coroutine)."""
    try:
        pending = atv.close()
        if pending:
            for task in pending:
                try:
                    await task
                except Exception:  # noqa: BLE001
                    pass
    except Exception:  # noqa: BLE001
        pass
