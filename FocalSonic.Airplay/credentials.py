"""
AirPlay pairing-credential persistence.

Opaque pyatv credentials, stored per-device-identifier in a JSON file under the
host data folder. The module owns its own store (host IPC is args-only).
"""

from __future__ import annotations

import json
import logging
import os
import sys
from pathlib import Path

log = logging.getLogger("focalsonic.airplay.credentials")

# Set once at startup from the host's --data-dir; creds/logs live under <it>/Airplay.
_DATA_DIR: str | None = None


def set_data_dir(path: str | None) -> None:
    global _DATA_DIR
    _DATA_DIR = path or None


def _store_dir() -> Path:
    if _DATA_DIR:
        base = Path(_DATA_DIR)
    else:
        base = _default_data_dir()
    path = base / "Airplay"
    path.mkdir(parents=True, exist_ok=True)
    return path


def _default_data_dir() -> Path:
    """Fallback when the host didn't pass --data-dir (e.g. run standalone):
    mirror the IgniteView layout under each platform's per-user data root."""
    if sys.platform == "win32":
        root = os.environ.get("LOCALAPPDATA") or os.path.expanduser("~")
    else:
        root = os.environ.get("XDG_DATA_HOME") or os.path.join(
            os.path.expanduser("~"), ".local", "share")
    return Path(root) / "IgniteViewApp" / "focalsonic"


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
