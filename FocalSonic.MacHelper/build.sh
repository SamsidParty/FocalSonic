#!/usr/bin/env bash
# Builds FocalSonicHelper, the native macOS companion process (MusicKit playback,
# audio effects, AirPlay and system Now Playing). FocalSonic.csproj runs this on macOS builds.
#
# Usage: ./build.sh [output-dir]           (default: ./build)
# Env:   UNIVERSAL=1                        build an arm64 + x86_64 binary
#        CODESIGN_IDENTITY="Developer ID…"  sign with a real identity + hardened runtime
#                                           (default: ad-hoc, which is enough to run locally)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="${1:-$SCRIPT_DIR/build}"
NAME="FocalSonicHelper"
# 14.2 introduced Core Audio process taps; 14.4 is where audio capture consent is reliable.
DEPLOYMENT_TARGET="14.4"

if [[ "${UNIVERSAL:-0}" == "1" ]]; then
    ARCHS=(arm64 x86_64)
else
    ARCHS=("$(uname -m)")
fi

mkdir -p "$OUT_DIR"
SOURCES=()
while IFS= read -r -d '' file; do SOURCES+=("$file"); done < <(find "$SCRIPT_DIR/Sources" -name '*.swift' -print0 | sort -z)

# Skip the (slow) optimised build when nothing changed since the last one.
OUTPUT="$OUT_DIR/$NAME"
if [[ -x "$OUTPUT" && -z "${FORCE:-}" ]]; then
    newest_input="$(find "$SCRIPT_DIR/Sources" "$SCRIPT_DIR/Info.plist" "$SCRIPT_DIR/build.sh" -newer "$OUTPUT" -print -quit)"
    built_archs=" $(lipo -archs "$OUTPUT" 2>/dev/null) "
    missing_arch=""
    for arch in "${ARCHS[@]}"; do
        [[ "$built_archs" == *" $arch "* ]] || missing_arch="$arch"
    done
    if [[ -z "$newest_input" && -z "$missing_arch" ]]; then
        echo "$NAME is up to date"
        exit 0
    fi
fi

SLICES=()
for arch in "${ARCHS[@]}"; do
    echo "Building $NAME for $arch (macOS $DEPLOYMENT_TARGET)..."
    slice="$OUT_DIR/$NAME-$arch"
    swiftc \
        -O \
        -swift-version 5 \
        -target "$arch-apple-macos$DEPLOYMENT_TARGET" \
        -module-name FocalSonicHelper \
        -framework MusicKit \
        -framework MediaPlayer \
        -framework AVFoundation \
        -framework CoreMedia \
        -framework CoreAudio \
        -framework AudioToolbox \
        -framework Accelerate \
        -framework AppKit \
        -Xlinker -sectcreate -Xlinker __TEXT -Xlinker __info_plist -Xlinker "$SCRIPT_DIR/Info.plist" \
        -o "$slice" \
        "${SOURCES[@]}"
    SLICES+=("$slice")
done

if [[ ${#SLICES[@]} -gt 1 ]]; then
    lipo -create -output "$OUTPUT" "${SLICES[@]}"
    rm -f "${SLICES[@]}"
else
    mv -f "${SLICES[0]}" "$OUTPUT"
fi

# The signature is what records the embedded Info.plist, so it's required even for local runs.
if [[ -n "${CODESIGN_IDENTITY:-}" ]]; then
    codesign --force --options runtime --timestamp --sign "$CODESIGN_IDENTITY" "$OUTPUT"
else
    codesign --force --sign - "$OUTPUT"
fi
chmod +x "$OUTPUT"

echo "Built $OUTPUT"
