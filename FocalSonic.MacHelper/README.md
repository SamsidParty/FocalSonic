# FocalSonic.MacHelper

`FocalSonicHelper` is FocalSonic's native companion process on macOS. It plays Apple Music
through MusicKit, runs the audio effects engine, and publishes the system Now Playing entry.
The .NET side talks to it through `FocalSonic/MacOS/MacHelper.cs`.

On Windows and Linux, Apple Music plays in a hidden music.apple.com window driven by FocalMK.
That doesn't work on macOS: WebKit doesn't expose MusicKit JS's tokens to an embedded
music.apple.com, and Widevine isn't available in WKWebView. Native MusicKit replaces it.

## Why a separate process

MusicKit's playback daemons only serve clients with a bundle identity in their code
signature. `build.sh` embeds [Info.plist](Info.plist) into the binary as a
`__TEXT,__info_plist` section and signs it, so the helper has that identity whether FocalSonic
runs from `dotnet run` or from `FocalSonic.app`, and FocalSonic itself stays a plain .NET
executable.

The build runs automatically from `FocalSonic.csproj` on macOS (universal in Release).
`./build.sh [output-dir]` builds it by hand; `--self-test` checks the DSP maths.

## Signing in

The developer token is the one Apple's web player ships with (`AMPWebPlay`), read from
music.apple.com's JavaScript by `AppleMusicDeveloperToken.cs`, the same token the Windows
sign-in gets from MusicKit JS. The helper makes MusicKit accept it:

- a token provider hands MusicKit the token, so it never asks Apple to vend one (which needs
  a paid developer account with the MusicKit capability), and
- an `Origin: https://music.apple.com` header is added to MusicKit's API traffic, since
  web player tokens are origin locked.

MusicKit then mints a music user token for the Mac's Apple Account (`userToken`), which the
rest of FocalSonic uses for the Apple Music API, exactly as on Windows.

## Playback

FocalSonic keeps the queue (shuffle, loop, radio). MusicKit's renderer, though, owns the
Now Playing entry and receives media keys, Control Center and AirPods commands itself. So
MusicKit is given the current track plus FocalSonic's next one, and whatever MusicKit does by
itself is reported back: `advanced` (it moved to the next track, or back), `ended`, and
`remote` play/pause. Natural track changes are gapless as a result.

macOS's MusicKit can't start a queue part way through ("unexpected start item") and breaks
if `queue.entries` is replaced, so the next track is only ever inserted after the current one.
A replaced queue only takes over once `play()` is called.

## Audio effects

Catalog audio is decrypted and rendered in MusicKit's per-client `RemotePlayerService`, so
there's no stream to put effects into. When an effect, a volume below 100% or varispeed is in
use, the helper captures that service's output with a Core Audio process tap (which also
mutes the original), processes it, and plays it through a private aggregate device. Only our
own instance of the service is tapped (matched by responsible process), never the helper
itself and never anything else on the system. Capture stops a few seconds after everything is
neutral again, which restores MusicKit's untouched output (lossless, Dolby Atmos).

The processing reproduces FocalMK's Web Audio graph so presets sound the same everywhere:

| Stage | Implementation |
| --- | --- |
| Varispeed | MusicKit time-stretches; NewTimePitch adds the matching pitch shift |
| EQ | Biquads with the Web Audio coefficient formulas and edge cases |
| Reverb | Partitioned FFT convolution with FocalSonic's impulse responses and `ConvolverNode` normalisation |
| Volume | The same squared curve as the web player, plus the pause/resume fade |

Capture needs the "Screen & System Audio Recording" permission. If it's granted but no audio
arrives while playing (consent denied), capture is abandoned so Apple Music is never left
muted, and FocalSonic shows an error.

## Protocol

One JSON object per line on stdin/stdout; stderr carries logs.

```jsonc
// host -> helper
{"id": 1, "cmd": "configure", "developerToken": "…"}
{"id": 2, "cmd": "authorize", "request": true}          // {"status": "authorized" | "denied" | …}
{"id": 3, "cmd": "userToken", "ignoreCache": false}     // {"token": "…"}
{"id": 4, "cmd": "load", "playbackID": "1785614776", "next": "1785614777", "autoplay": true}
{"id": 5, "cmd": "setNext", "next": "…"}
{"id": 6, "cmd": "play" | "pause" | "stop" | "describe" | "subscription"}
{"id": 7, "cmd": "seek", "time": 42.5}
{"id": 8, "cmd": "setRepeat", "one": true}
{"id": 9, "cmd": "setRate", "rate": 1.25, "varispeed": true}
{"id": 10, "cmd": "setVolume", "gain": 0.36}             // linear gain
{"id": 11, "cmd": "setEffects", "bands": [{"type": "PEAK", "freq": 31, "gain": 4, "q": 1.41}], "reverb": 0.3, "impulse": "/path/to.wav"}
{"id": 12, "cmd": "nowPlaying", "active": true, "title": "…", "artist": "…", "playing": true, …}

// helper -> host
{"reply": 4, "ok": true, "duration": 262.1}
{"reply": 5, "ok": false, "error": "…"}
{"event": "state", "id": "1785614776", "status": "playing", "time": 12.3, "duration": 262.1}
{"event": "advanced" | "ended" | "remote" | "variant" | "effects", …}
```

Playback commands run strictly in order (a pause sent during a slow load lands after it);
`setVolume`, `setEffects` and `nowPlaying` don't wait behind them.
