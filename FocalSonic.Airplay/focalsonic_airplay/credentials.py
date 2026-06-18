"""
AirPlay pairing-credential persistence.

pyatv credentials are opaque strings that survive reboots; we only re-pair if the
device is reset/unpaired. They are stored per-device-identifier in a JSON file
under the FocalSonic app-data folder. The C# host never touches these — per the
design, the only IPC into this module is command-line args, so the Python module
owns its own credential store.
"""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path

log = logging.getLogger("focalsonic.airplay.credentials")

# The host passes its real IgniteView data path via --data-dir; we store creds and
# logs under an "Airplay" subfolder of it (e.g.
# %LOCALAPPDATA%\IgniteViewApp\focalsonic\Airplay). set_data_dir() is called once
# at startup before anything reads/writes.
_DATA_DIR: str | None = None


def set_data_dir(path: str | None) -> None:
    global _DATA_DIR
    _DATA_DIR = path or None


def _store_dir() -> Path:
    if _DATA_DIR:
        base = Path(_DATA_DIR)
    else:
        # Fallback (e.g. run standalone): mirror the IgniteView layout.
        local = os.environ.get("LOCALAPPDATA") or os.path.expanduser("~")
        base = Path(local) / "IgniteViewApp" / "focalsonic"
    path = base / "Airplay"
    path.mkdir(parents=True, exist_ok=True)
    return path


def _store_file() -> Path:
    return _store_dir() / "credentials.json"


def _load_all() -> dict:
    f = _store_file()
    if not f.exists():
        return {}
    try:
        return json.loads(f.read_text(encoding="utf-8"))
    except Exception:  # noqa: BLE001 - corrupt store shouldn't crash streaming
        log.warning("Credential store is unreadable; starting fresh")
        return {}


def get_credentials(identifier: str) -> str | None:
    return _load_all().get(identifier)


def save_credentials(identifier: str, credentials: str) -> None:
    data = _load_all()
    data[identifier] = credentials
    tmp = _store_file().with_suffix(".tmp")
    tmp.write_text(json.dumps(data, indent=2), encoding="utf-8")
    tmp.replace(_store_file())
    log.info("Saved AirPlay credentials for %s", identifier)


def clear_credentials(identifier: str) -> None:
    data = _load_all()
    if identifier in data:
        del data[identifier]
        _store_file().write_text(json.dumps(data, indent=2), encoding="utf-8")
