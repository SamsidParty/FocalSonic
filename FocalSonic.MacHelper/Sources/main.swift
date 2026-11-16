// FocalSonicHelper: FocalSonic's native macOS companion process.
//
// Apple doesn't let MusicKit JS hand out tokens inside WKWebView, and catalog audio can't
// be decrypted in a web view on macOS anyway, so on macOS FocalSonic plays Apple Music
// through native MusicKit instead of a hidden player window. MusicKit's playback daemons
// only serve clients with a bundle identity in their code signature, which this binary has
// embedded (see build.sh), so the .NET host can stay a plain executable.
//
// The host drives it over stdin/stdout (see IPC.swift) and owns all queue logic.

import AppKit
import Foundation
import MusicKit

@MainActor
final class Dispatcher {
    static let shared = Dispatcher()

    private var playbackQueue: Task<Void, Never>?

    func receive(_ command: Command) {
        switch command.name {
        // These don't touch MusicKit's player, so they never wait behind a slow load.
        case "nowPlaying", "setVolume", "setEffects", "airplayPrepare", "airplayStop", "ping":
            runImmediately(command)
        case "shutdown":
            command.succeed()
            Helper.exit()
        default:
            // Everything else runs strictly in order: a pause sent while a track is still
            // loading must land after the load, not before it.
            let previous = playbackQueue
            playbackQueue = Task { @MainActor in
                await previous?.value
                await self.run(command)
            }
        }
    }

    private func runImmediately(_ command: Command) {
        do {
            switch command.name {
            case "nowPlaying":
                NowPlayingController.shared.update(command)
                command.succeed()
            case "setVolume":
                try EffectsController.shared.update { $0.gain = command.number("gain") ?? 1 }
                command.succeed(["effectsActive": EffectsController.shared.isActive])
            case "setEffects":
                let bands = command.objects("bands").compactMap { band -> EQBand? in
                    guard let frequency = (band["freq"] as? NSNumber)?.doubleValue else { return nil }
                    return EQBand(type: FilterType(name: band["type"] as? String),
                                  frequency: frequency,
                                  gain: (band["gain"] as? NSNumber)?.doubleValue ?? 0,
                                  q: (band["q"] as? NSNumber)?.doubleValue ?? 1)
                }
                try EffectsController.shared.update { settings in
                    settings.bands = bands
                    settings.reverb = command.number("reverb") ?? 0
                    settings.impulsePath = command.string("impulse")
                }
                command.succeed(["effectsActive": EffectsController.shared.isActive])
            case "airplayPrepare":
                let hostPID = command.number("hostPID").map { pid_t($0) }
                let contextID = try AirPlayController.shared.prepare(hostPID: hostPID)
                command.succeed(["contextID": contextID, "active": AirPlayController.shared.isActive])
            case "airplayStop":
                AirPlayController.shared.stop()
                command.succeed()
            default:
                command.succeed()
            }
        } catch {
            command.fail(error)
        }
    }

    private func run(_ command: Command) async {
        let playback = PlaybackController.shared
        let effects = EffectsController.shared

        do {
            switch command.name {
            case "configure":
                Credentials.configure(developerToken: try command.requireString("developerToken"))
                command.succeed()

            case "authorize":
                let status = command.bool("request") == true
                    ? await MusicAuthorization.request()
                    : MusicAuthorization.currentStatus
                command.succeed(["status": Self.describe(status)])

            case "userToken":
                let token = try await Credentials.userToken(ignoreCache: command.bool("ignoreCache") ?? false)
                command.succeed(["token": token])

            case "subscription":
                let subscription = try await MusicSubscription.current
                command.succeed(["canPlayCatalogContent": subscription.canPlayCatalogContent,
                                 "canBecomeSubscriber": subscription.canBecomeSubscriber])

            case "load":
                playback.start()
                effects.resetFade()
                let result = try await playback.load(try command.requireString("playbackID"),
                                                     autoplay: command.bool("autoplay") ?? true)
                command.succeed(result)

            case "play":
                try await playback.play()
                effects.fadeIn(seconds: 0.4)
                command.succeed()

            case "pause":
                // Like the web player: fade out, then pause (the fade needs capture to be on).
                await effects.fade(to: 0, seconds: 0.4)
                playback.pause()
                command.succeed()

            case "stop":
                playback.stop()
                effects.resetFade()
                command.succeed()

            case "seek":
                playback.seek(to: command.number("time") ?? 0)
                command.succeed()

            case "describe":
                command.succeed(playback.describe())

            case "setRepeat":
                playback.setRepeatOne(command.bool("one") ?? false)
                command.succeed()

            case "setRate":
                let rate = max(0.5, min(command.number("rate") ?? 1, 2))
                playback.setRate(Float(rate))
                let varispeed = command.bool("varispeed") ?? true
                try effects.update { $0.pitch = varispeed ? rate : 1 }
                command.succeed(["rate": rate, "effectsActive": effects.isActive])

            default:
                throw HelperError("Unknown command '\(command.name)'")
            }
        } catch {
            command.fail(error)
        }
    }

    private static func describe(_ status: MusicAuthorization.Status) -> String {
        switch status {
        case .authorized: return "authorized"
        case .denied: return "denied"
        case .restricted: return "restricted"
        case .notDetermined: return "notDetermined"
        @unknown default: return "notDetermined"
        }
    }
}

extension EffectsController {
    func fadeIn(seconds: Double) {
        guard isActive else { return }
        Task { await fade(to: 1, seconds: seconds) }
    }
}

enum Helper {
    /// Un-mutes MusicKit (by releasing any capture) and leaves the system UI tidy on the way out.
    @MainActor
    static func exit() -> Never {
        PlaybackController.shared.shutdown()
        AirPlayController.shared.shutdown()
        EffectsController.shared.shutdown()
        NowPlayingController.shared.clear()
        Darwin.exit(0)
    }

    static func readCommands() {
        let reader = Thread {
            while let line = readLine(strippingNewline: true) {
                guard !line.isEmpty, let command = Command(line: line) else { continue }
                DispatchQueue.main.async { MainActor.assumeIsolated { Dispatcher.shared.receive(command) } }
            }
            // stdin closed: the host is gone.
            DispatchQueue.main.async { MainActor.assumeIsolated { Helper.exit() } }
        }
        reader.name = "stdin"
        reader.start()
    }
}

if CommandLine.arguments.contains("--self-test") {
    exit(SelfTest.run() ? 0 : 1)
}

// A host that dies mid-write must not take the helper down with SIGPIPE; stdin EOF ends it.
signal(SIGPIPE, SIG_IGN)
let signalSources = [SIGTERM, SIGINT].map { terminating -> DispatchSourceSignal in
    signal(terminating, SIG_IGN)
    let source = DispatchSource.makeSignalSource(signal: terminating, queue: .main)
    source.setEventHandler { MainActor.assumeIsolated { Helper.exit() } }
    source.resume()
    return source
}

// An NSApplication (never shown, no Dock icon) is the environment MediaPlayer's
// Now Playing and remote commands expect.
let application = NSApplication.shared
application.setActivationPolicy(.prohibited)

Helper.readCommands()
IPC.event("ready", ["version": 1, "pid": Int(ProcessInfo.processInfo.processIdentifier)])
application.run()
