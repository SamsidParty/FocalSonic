#!/usr/bin/env bash
# Packages FocalSonic.app: a self-contained Release publish wrapped in a bundle with the
# com.samsidparty.focalsonic identity, so macOS attributes the Apple Music and audio
# capture permissions to FocalSonic itself.
#
# Usage: MacApp/build-app.sh [arm64|x64]          (default: this Mac's architecture)
# Env:   CODESIGN_IDENTITY="Developer ID Application: …"
#            sign with a real identity and the hardened runtime (needed for notarisation);
#            without it the bundle is ad-hoc signed, which is enough to run on this Mac.
# Output: bin/production/<arch>/FocalSonic.app
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUNDLE_DIR="$PROJECT_DIR/MacApp"

ARCH="${1:-$(uname -m)}"
[[ "$ARCH" == "x86_64" ]] && ARCH="x64"
RID="osx-$ARCH"

PUBLISH_DIR="$PROJECT_DIR/bin/production/$RID/publish"
APP="$PROJECT_DIR/bin/production/$RID/FocalSonic.app"
VERSION="$(sed -n 's/.*"version": *"\([0-9.]*\)".*/\1/p' "$PROJECT_DIR/src-vite/package.json" | head -1)"

echo "Publishing FocalSonic $VERSION for $RID..."
rm -rf "$PUBLISH_DIR"
dotnet publish "$PROJECT_DIR/FocalSonic.csproj" -c Release -r "$RID" --self-contained true -o "$PUBLISH_DIR"

echo "Assembling $APP..."
rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
cp -R "$PUBLISH_DIR/." "$APP/Contents/MacOS/"
sed "s/__VERSION__/$VERSION/g" "$BUNDLE_DIR/Info.plist" > "$APP/Contents/Info.plist"

# Icon, from the macOS style artwork.
ICONSET="$(mktemp -d)/FocalSonic.iconset"
mkdir -p "$ICONSET"
for size in 16 32 128 256 512; do
    sips -z $size $size "$PROJECT_DIR/src-vite/public/icon_shadow.png" --out "$ICONSET/icon_${size}x${size}.png" >/dev/null
    sips -z $((size * 2)) $((size * 2)) "$PROJECT_DIR/src-vite/public/icon_shadow.png" --out "$ICONSET/icon_${size}x${size}@2x.png" >/dev/null
done
iconutil -c icns "$ICONSET" -o "$APP/Contents/Resources/FocalSonic.icns"
rm -rf "$(dirname "$ICONSET")"

# Sign inside out: every file next to the executable (codesign treats the .NET assemblies
# and assets there as code too), the helper (its embedded Info.plist identity, which
# MusicKit requires, survives re-signing), then the bundle.
echo "Signing..."
if [[ -n "${CODESIGN_IDENTITY:-}" ]]; then
    SIGN=(codesign --force --timestamp --options runtime --sign "$CODESIGN_IDENTITY")
    APP_SIGN=("${SIGN[@]}" --entitlements "$BUNDLE_DIR/FocalSonic.entitlements")
else
    SIGN=(codesign --force --sign -)
    APP_SIGN=("${SIGN[@]}")
fi

find "$APP/Contents/MacOS" -type f ! -name FocalSonic ! -name FocalSonicHelper -print0 | xargs -0 "${SIGN[@]}" 2>&1 | grep -v "replacing existing signature" || true
"${SIGN[@]}" "$APP/Contents/MacOS/FocalSonicHelper"
"${APP_SIGN[@]}" "$APP"

codesign --verify --strict "$APP" && echo "Built $APP"
