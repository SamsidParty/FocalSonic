#!/usr/bin/env bash
# =============================================================================
#  build-airplay.sh
#
#  Linux counterpart of build-airplay.bat: builds the FocalSonic AirPlay module
#  into a single, self-contained executable with Nuitka and drops it (with its
#  favicon.png) into the module's own folder inside the matching IgniteView native
#  runtime, so the FocalSonic build picks it up automatically:
#
#      ../FocalSonic/iv2runtime/linux-<arch>/native/airplay/focalsonic-airplay
#      ../FocalSonic/iv2runtime/linux-<arch>/native/airplay/favicon.png
#
#  Nuitka does NOT cross-compile: it builds for the architecture of the Python
#  interpreter it runs under. Run this once per architecture you want to ship.
#
#  Requires Python (3.10+; see requirements.txt — Linux doesn't need 3.12 the way
#  Windows does, because it never resamples), a C compiler, patchelf (Nuitka uses it
#  for onefile builds), and Tk for the PIN dialog:
#
#      Fedora:        sudo dnf install gcc patchelf python3-tkinter
#      Debian/Ubuntu: sudo apt install gcc patchelf python3-tk
#
#  The module shells out to the audio server's own capture helpers at runtime, so
#  the machines that RUN this binary need pulseaudio-utils (parec) or
#  pipewire-utils (pw-record). They are system packages and are deliberately not
#  bundled.
# =============================================================================
set -euo pipefail

cd "$(dirname "$0")"

# --- locate a usable Python --------------------------------------------------
# Prefer 3.12 when it's around so a Linux build matches the Windows one, but any
# interpreter pyatv supports will do.
PY=""
for candidate in python3.12 python3 python; do
    if command -v "$candidate" >/dev/null 2>&1; then
        PY="$candidate"
        break
    fi
done
if [[ -z "$PY" ]]; then
    echo "[ERROR] No Python interpreter found." >&2
    exit 1
fi

if ! "$PY" -c 'import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)'; then
    echo "[ERROR] Python 3.10+ is required; $PY is $("$PY" --version 2>&1)." >&2
    exit 1
fi
echo "[build] Interpreter: $PY ($("$PY" --version 2>&1))"

if ! "$PY" -c 'import tkinter' >/dev/null 2>&1; then
    echo "[ERROR] tkinter is missing — the PIN dialog needs it." >&2
    echo "        Install python3-tkinter (Fedora) or python3-tk (Debian/Ubuntu)." >&2
    exit 1
fi

# Only a warning: recent Nuitka can fetch its own patchelf, and --assume-yes-for-
# downloads below lets it. Saying so up front beats failing deep into a long build.
if ! command -v patchelf >/dev/null 2>&1; then
    echo "[warn] patchelf not found. Nuitka needs it for onefile builds and will try"
    echo "       to download one; install it (dnf/apt install patchelf) if that fails."
fi

# --- resolve the target architecture from the interpreter --------------------
MACHINE="$("$PY" -c 'import platform; print(platform.machine().lower())')"
case "$MACHINE" in
    x86_64|amd64) ARCH="linux-x64" ;;
    aarch64|arm64) ARCH="linux-arm64" ;;
    *)
        echo "[ERROR] Unsupported / unrecognised architecture: \"$MACHINE\"" >&2
        exit 1
        ;;
esac
echo "[build] Target: $ARCH  (machine=$MACHINE)"

# --- create / reuse an isolated build virtualenv -----------------------------
VENV=".build-venv"
if [[ ! -x "$VENV/bin/python" ]]; then
    echo "[build] Creating build virtualenv in \"$VENV\" ..."
    "$PY" -m venv "$VENV"
fi
VPY="$VENV/bin/python"

echo "[build] Installing dependencies (pyatv) + Nuitka ..."
"$VPY" -m pip install --upgrade pip
# nuitka[onefile] pulls in zstandard so the onefile binary is compressed (smaller).
"$VPY" -m pip install -r requirements.txt "nuitka[onefile]"

# --- compile -----------------------------------------------------------------
OUTDIR="../FocalSonic/iv2runtime/$ARCH/native/airplay"
mkdir -p "$OUTDIR"

WORKDIR="build/$ARCH"
rm -rf "$WORKDIR"

echo "[build] Compiling with Nuitka -- this can take several minutes ..."
"$VPY" -m nuitka \
    --onefile \
    --assume-yes-for-downloads \
    --enable-plugin=tk-inter \
    --include-package=pyatv \
    --include-package-data=pyatv \
    --company-name=SamsidParty \
    --product-name="FocalSonic AirPlay" \
    --file-description="FocalSonic AirPlay" \
    --product-version=1.0.0 \
    --output-filename=focalsonic-airplay \
    --output-dir="$WORKDIR" \
    airplay.py

install -m 755 "$WORKDIR/focalsonic-airplay" "$OUTDIR/focalsonic-airplay"
# The PIN dialog loads this at runtime for its window/body icon (see pin_dialog.py).
install -m 644 favicon.png "$OUTDIR/favicon.png"

echo
echo "[build] Success: $OUTDIR/focalsonic-airplay"
echo "[build] Build FocalSonic to bundle it."
