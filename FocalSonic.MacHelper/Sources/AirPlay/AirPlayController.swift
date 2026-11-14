import Foundation

/// FocalSonic's own AirPlay route. The host shows Apple's AirPlay picker for this route's
/// context; once the user picks speakers, the capture that runs for effects is switched to
/// AirPlay mode, so FocalSonic's audio (and only FocalSonic's) plays on the speakers with its
/// effects, volume and speed, while the rest of the Mac stays on its own output device.
@MainActor
final class AirPlayController {
    static let shared = AirPlayController()

    private var context: OutputContext?
    private var observer: NSObjectProtocol?
    private var poll: Timer?
    private var hostPID: pid_t?
    private var speakers: [String] = []
    /// FocalSonic ended AirPlay itself; the route isn't followed again until it's let go of the
    /// speakers (or the picker is opened again), so a slow release doesn't restart it.
    private var releasing = false

    var isActive: Bool { !speakers.isEmpty }

    private init() {}

    /// The context the host's picker should route. Made once and kept, so the picker shows
    /// (and can change) the speakers already in use.
    func prepare(hostPID: pid_t?) throws -> String {
        if let hostPID, hostPID > 0 { self.hostPID = hostPID }
        releasing = false
        if let context { return context.id }

        guard let context = OutputContext.make() else {
            throw HelperError("This version of macOS doesn't let FocalSonic play to AirPlay speakers")
        }
        self.context = context
        observer = context.observe { [weak self] in MainActor.assumeIsolated { self?.refresh() } }

        // The notifications cover changes from the picker; this catches anything they miss
        // (a speaker taken over by another device, for one).
        let timer = Timer(timeInterval: 1, repeats: true) { [weak self] _ in
            MainActor.assumeIsolated { self?.refresh() }
        }
        RunLoop.main.add(timer, forMode: .common)
        poll = timer

        log("AirPlay route ready")
        return context.id
    }

    /// FocalSonic stopped casting: hand the speakers back and play locally again.
    func stop() {
        end(error: nil)
    }

    /// Capture can't run (no permission, or the route broke), so AirPlay can't either.
    func fail(_ message: String) {
        guard isActive else { return }
        log("AirPlay stopped: \(message)")
        end(error: message)
    }

    private func end(error: String?) {
        guard let context else { return }
        let wasActive = isActive

        speakers = []
        releasing = true
        EffectsController.shared.stopAirPlay() // before the route goes back to the Mac's speakers
        context.disconnect()
        if wasActive || error != nil { report(error: error) }
    }

    func shutdown() {
        stop()
        poll?.invalidate()
        poll = nil
        if let observer { NotificationCenter.default.removeObserver(observer) }
        observer = nil
        context = nil
    }

    private func refresh() {
        guard let context else { return }
        let current = context.speakers
        if releasing {
            if current.isEmpty { releasing = false }
            return
        }
        guard current != speakers else { return }

        let wasActive = isActive
        speakers = current

        if isActive, !wasActive {
            log("AirPlay to \(current.joined(separator: ", "))")
            do {
                try EffectsController.shared.startAirPlay(.init(context: context, hostPID: hostPID))
            } catch {
                // Leave the speakers free rather than routed to silence.
                end(error: error.localizedDescription)
                return
            }
        } else if !isActive, wasActive {
            log("AirPlay ended, back to local playback")
            EffectsController.shared.stopAirPlay()
        }
        report()
    }

    private func report(error: String? = nil) {
        var fields: [String: Any] = ["active": isActive, "speakers": speakers]
        if let error { fields["error"] = error }
        IPC.event("airplay", fields)
    }
}

/// Where the capture should play while AirPlay is on.
struct AirPlayTarget {
    let context: OutputContext
    /// FocalSonic itself, which plays music from servers other than Apple Music.
    let hostPID: pid_t?
}
