# FocalSonic.MacHelper

`FocalSonicHelper` is FocalSonic's native companion process on macOS. It plays Apple Music
through MusicKit, runs the audio effects engine, plays to AirPlay speakers, and publishes the
system Now Playing entry.
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

FocalSonic keeps the queue (shuffle, loop, radio) and, like FocalMK's web player on Windows
and Linux, MusicKit only ever gets the current track, as the only entry of a fresh queue. When
it runs out the helper reports `ended` and the host loads the next one. (MusicKit used to hold
the next track too, for gapless changes, but keeping its queue in step with the host's took
guessing what MusicKit had done, and wrong guesses replayed or skipped tracks.) A replaced
queue only takes over once `play()` is called.

The system's media controls are FocalSonic's own entry, published by `NowPlayingController`
from what the host sends (`nowPlaying`), as on Windows. MusicKit's renderer would otherwise make
itself the Now Playing app and take the media keys, Control Center and AirPods commands, so
`NowPlayingTakeover` switches that off through a private MediaPlayer setting
(`disableAutomaticCanBeNowPlaying` on the `MPMusicPlayerApplicationController` behind
`ApplicationMusicPlayer`). `load` replies `ownNowPlaying: false` if that setting can't be found,
and the host then leaves MusicKit's entry in charge. `FOCALSONIC_MUSICKIT_NOW_PLAYING=1` does
the same on purpose. `remote` play/pause still reports MusicKit pausing by itself (headphones
unplugged, say).

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
| Limiter | A look-ahead peak limiter at 0 dBFS (no web counterpart, see below) |

Catalog masters peak right at full scale, and EQ boosts, reverb and MusicKit's time stretching
all push them over it. The browser and OS soften that on other platforms; on macOS the output
device or the AirPlay encoder would hard clip it, so the limiter catches it first. Below full
scale it passes audio through bit for bit, 3 ms late.

Any speed other than 1x can't be transparent: MusicKit's player always uses AVFoundation's
`spectral` time-pitch algorithm (`MPAVItem.preferredAudioTimePitchAlgorithm` returns a constant),
a phase vocoder, and varispeed then adds NewTimePitch, a second one. Real resampling, as the web
player does with `preservesPitch = false`, would need the audio faster than MusicKit plays it.

Capture needs the "Screen & System Audio Recording" permission (AirPlay too). If it's granted but no audio
arrives while playing (consent denied), capture is abandoned so Apple Music is never left
muted, and FocalSonic shows an error.

## AirPlay

Windows and Linux stream to AirPlay with a Python module (FocalSonic.Airplay). macOS does it
natively, through the same capture as the effects, so only FocalSonic's audio goes to the
speakers and the rest of the Mac stays on its output device.

macOS has no public API for this. AVFoundation's route discovery is filtered for apps other than
Apple's (the system finds the speakers but doesn't hand them over), and the Core Audio "AirPlay"
device only exists for the system-wide route. What works is what Music does:

- The helper makes an `AVOutputContext` of its own (`iTunesAudioContext`: app-owned, audio,
  multi-room). See [OutputContext.swift](Sources/AirPlay/OutputContext.swift).
- The host shows Apple's AirPlay picker for it: an `AVRoutePickerView` pointed at the context's
  ID (`setOutputContextID:`), invisible over the cast button and pressed for the user, so the menu
  is Apple's own (`FocalSonic/MacOS/MacAirPlay.cs`). The cast menu has one "AirPlay" entry for it.
- Once speakers are picked, capture runs whether or not effects are on. The aggregate's output
  stays silent, and the processed audio goes into an `AVSampleBufferAudioRenderer` bound to the
  context ([AirPlayStream.swift](Sources/AirPlay/AirPlayStream.swift)). FocalSonic itself is
  tapped too, for other servers' music, and mixed in without effects (it applies its own volume).

The capture and the speakers run on different clocks, so the queued audio is kept between
bounds, with a skip or a short gap (faded in) when it drifts out of them. Expect the usual AirPlay
delay of a couple of seconds. `AVOutputContext` and the picker's `setOutputContextID:` are private
API, looked up at runtime; if a future macOS changes them, AirPlay reports that it's unavailable.

## Protocol

One JSON object per line on stdin/stdout; stderr carries logs.

```jsonc
// host -> helper
{"id": 1, "cmd": "configure", "developerToken": "…"}
{"id": 2, "cmd": "authorize", "request": true}          // {"status": "authorized" | "denied" | …}
{"id": 3, "cmd": "userToken", "ignoreCache": false}     // {"token": "…"}
{"id": 4, "cmd": "load", "playbackID": "1785614776", "autoplay": true}
{"id": 6, "cmd": "play" | "pause" | "stop" | "describe" | "subscription"}
{"id": 7, "cmd": "seek", "time": 42.5}
{"id": 8, "cmd": "setRepeat", "one": true}
{"id": 9, "cmd": "setRate", "rate": 1.25, "varispeed": true}
{"id": 10, "cmd": "setVolume", "gain": 0.36}             // linear gain
{"id": 11, "cmd": "setEffects", "bands": [{"type": "PEAK", "freq": 31, "gain": 4, "q": 1.41}], "reverb": 0.3, "impulse": "/path/to.wav"}
{"id": 12, "cmd": "nowPlaying", "active": true, "title": "…", "artist": "…", "playing": true, …}
{"id": 13, "cmd": "airplayPrepare", "hostPID": 4242}       // {"contextID": "…", "active": false}
{"id": 14, "cmd": "airplayStop"}

// helper -> host
{"reply": 4, "ok": true, "duration": 262.1, "ownNowPlaying": true}
{"reply": 5, "ok": false, "error": "…"}
{"event": "state", "id": "1785614776", "status": "playing", "time": 12.3, "duration": 262.1}
{"event": "ended" | "remote" | "variant" | "effects", …}
{"event": "airplay", "active": true, "speakers": ["Bedroom"]}  // and "error" when it had to stop
```

Playback commands run strictly in order (a pause sent during a slow load lands after it);
`setVolume`, `setEffects`, `nowPlaying` and the AirPlay commands don't wait behind them.
