"""
Find the WebView2 process to capture audio from.

FocalSonic's audio plays in WebView2, and capturing FocalSonic.exe's own process
tree picks up nothing. So we find the msedgewebview2.exe browser process owned by
the host and capture ITS tree (which contains the audio service). Toolhelp32 only.
"""

from __future__ import annotations

import ctypes
import logging
from ctypes import wintypes

log = logging.getLogger("focalsonic.airplay.finder")

TH32CS_SNAPPROCESS = 0x00000002
WEBVIEW2_EXE = "msedgewebview2.exe"
MAX_PATH = 260


class PROCESSENTRY32W(ctypes.Structure):
    _fields_ = [
        ("dwSize", wintypes.DWORD),
        ("cntUsage", wintypes.DWORD),
        ("th32ProcessID", wintypes.DWORD),
        ("th32DefaultHeapID", ctypes.POINTER(ctypes.c_ulong)),
        ("th32ModuleID", wintypes.DWORD),
        ("cntThreads", wintypes.DWORD),
        ("th32ParentProcessID", wintypes.DWORD),
        ("pcPriClassBase", ctypes.c_long),
        ("dwFlags", wintypes.DWORD),
        ("szExeFile", ctypes.c_wchar * MAX_PATH),
    ]


def _snapshot() -> list[tuple[int, int, str]]:
    """Return [(pid, ppid, exe_name_lower), ...] for all processes."""
    kernel32 = ctypes.windll.kernel32
    CreateToolhelp32Snapshot = kernel32.CreateToolhelp32Snapshot
    CreateToolhelp32Snapshot.restype = wintypes.HANDLE
    Process32FirstW = kernel32.Process32FirstW
    Process32NextW = kernel32.Process32NextW
    CloseHandle = kernel32.CloseHandle

    snap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0)
    if snap == wintypes.HANDLE(-1).value:
        raise OSError("CreateToolhelp32Snapshot failed")

    procs: list[tuple[int, int, str]] = []
    try:
        entry = PROCESSENTRY32W()
        entry.dwSize = ctypes.sizeof(PROCESSENTRY32W)
        ok = Process32FirstW(snap, ctypes.byref(entry))
        while ok:
            procs.append((entry.th32ProcessID, entry.th32ParentProcessID, entry.szExeFile.lower()))
            ok = Process32NextW(snap, ctypes.byref(entry))
    finally:
        CloseHandle(snap)
    return procs


def find_webview2_target(host_pid: int) -> int | None:
    """Return the WebView2 browser PID owned by `host_pid` (or None). Picks the one
    with the most WebView2 descendants when several exist."""
    try:
        procs = _snapshot()
    except OSError as exc:
        log.warning("Process snapshot failed: %s", exc)
        return None

    by_parent: dict[int, list[int]] = {}
    name_of: dict[int, str] = {}
    for pid, ppid, name in procs:
        name_of[pid] = name
        by_parent.setdefault(ppid, []).append(pid)

    # Descendant set of the host process.
    descendants: set[int] = set()
    stack = list(by_parent.get(host_pid, []))
    while stack:
        pid = stack.pop()
        if pid in descendants:
            continue
        descendants.add(pid)
        stack.extend(by_parent.get(pid, []))

    # Browser processes = WebView2 procs whose parent isn't itself WebView2.
    browsers = [
        pid for pid in descendants
        if name_of.get(pid) == WEBVIEW2_EXE
        and name_of.get(_parent(procs, pid)) != WEBVIEW2_EXE
    ]
    if not browsers:
        log.warning("No WebView2 process found under host PID %s", host_pid)
        return None

    def webview2_descendant_count(root: int) -> int:
        count = 0
        stack = list(by_parent.get(root, []))
        seen = set()
        while stack:
            pid = stack.pop()
            if pid in seen:
                continue
            seen.add(pid)
            if name_of.get(pid) == WEBVIEW2_EXE:
                count += 1
            stack.extend(by_parent.get(pid, []))
        return count

    target = max(browsers, key=webview2_descendant_count)
    log.info("Targeting WebView2 browser PID %s (of host %s)", target, host_pid)
    return target


def _parent(procs: list[tuple[int, int, str]], pid: int) -> int:
    for p, ppid, _ in procs:
        if p == pid:
            return ppid
    return 0
