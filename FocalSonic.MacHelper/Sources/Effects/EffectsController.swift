import Foundation

/// Decides when audio has to be captured and keeps the DSP chain in sync with FocalSonic's
/// settings. Capture only runs while something would audibly change the sound, so ordinary
/// playback stays on MusicKit's untouched path (full quality, Dolby Atmos intact).
@MainActor
final class EffectsController {
    static let shared = EffectsController()

    struct Settings: Equatable {
        var bands: [EQBand] = []
        /// Wet level, 0...1.
        var reverb: Double = 0
        var impulsePath: String?
        /// Linear output gain, 0...1.
        var gain: Double = 1
        /// Pitch multiplier for varispeed (1 = unchanged).
        var pitch: Double = 1

        var needsCapture: Bool {
            abs(gain - 1) > 0.0005 || abs(pitch - 1) > 0.0005 || reverb > 0.0001 || bands.contains { !$0.isNeutral }
        }
    }

    private(set) var settings = Settings()
    private let chain = DSPChain()
    private var tap: ProcessTap?
    private var reverb: ConvolutionReverb?
    private var reverbPath: String?
    private var lastError: String?

    private var teardown: DispatchWorkItem?
    private let gracePeriod = 4.0

    // If capture is permitted but delivers nothing (consent denied), the original audio
    // would stay muted. Give up on capture rather than leave the user in silence.
    private var watchdog: Timer?
    private var heardAudio = false
    private var silentPlayingSeconds = 0
    private var captureBlocked = false

    var isActive: Bool { tap != nil }

    /// Capturing while nothing is loaded would only keep the audio hardware awake.
    private var wantsCapture: Bool { settings.needsCapture && PlaybackController.shared.hasTrack }

    private init() {}

    // MARK: Settings

    func update(_ change: (inout Settings) -> Void) throws {
        var updated = settings
        change(&updated)
        // The host re-sends unchanged settings with every track; those mustn't retry a capture
        // that already failed, but a deliberate change is worth another try.
        guard updated != settings else { return }

        captureBlocked = false
        settings = updated
        try apply()
    }

    /// A track was loaded or playback stopped.
    func playbackChanged() {
        do {
            try apply()
        } catch {
            log("Couldn't start effects capture: \(error.localizedDescription)")
        }
    }

    private func apply() throws {
        defer { report() }

        guard wantsCapture else {
            if isActive {
                push()
                scheduleTeardown()
            }
            return
        }

        teardown?.cancel()
        teardown = nil

        if tap == nil {
            guard !captureBlocked else { return }
            do {
                try activate()
            } catch {
                // Stay off until the user changes something, rather than retrying every track.
                captureBlocked = true
                lastError = error.localizedDescription
                throw error
            }
        }
        push()
    }

    /// Fades the processed output (only meaningful while capturing).
    func fade(to level: Float, seconds: Double) async {
        guard isActive else { return }
        chain.fade(to: level, seconds: Float(seconds))
        try? await Task.sleep(nanoseconds: UInt64(seconds * 1_000_000_000))
    }

    func resetFade() {
        chain.fade(to: 1, seconds: 0)
    }

    func shutdown() {
        deactivate()
    }

    // MARK: Capture lifecycle

    private func activate() throws {
        chain.fade(to: 1, seconds: 0)
        let tap = try ProcessTap(chain: chain)
        tap.onInvalidated = { [weak self] in self?.rebuild() }
        self.tap = tap
        lastError = nil
        startWatchdog()
    }

    private func deactivate() {
        watchdog?.invalidate()
        watchdog = nil
        tap?.destroy()
        tap = nil
    }

    private func rebuild() {
        guard tap != nil else { return }
        log("Audio route changed, restarting effects capture")
        deactivate()
        do {
            try apply()
        } catch {
            log("Couldn't restart effects capture: \(error.localizedDescription)")
        }
    }

    private func scheduleTeardown() {
        guard teardown == nil else { return }
        let work = DispatchWorkItem { [weak self] in
            MainActor.assumeIsolated {
                guard let self else { return }
                self.teardown = nil
                guard !self.wantsCapture else { return }
                self.deactivate()
                self.report()
                log("Effects are neutral again, back to direct playback")
            }
        }
        teardown = work
        DispatchQueue.main.asyncAfter(deadline: .now() + gracePeriod, execute: work)
    }

    private func startWatchdog() {
        heardAudio = false
        silentPlayingSeconds = 0
        watchdog?.invalidate()

        let timer = Timer(timeInterval: 1, repeats: true) { [weak self] _ in
            MainActor.assumeIsolated { self?.checkCapture() }
        }
        RunLoop.main.add(timer, forMode: .common)
        watchdog = timer
    }

    private func checkCapture() {
        if chain.takePeak() > 0.000001 {
            heardAudio = true
            watchdog?.invalidate()
            watchdog = nil
            log("Effects capture is receiving audio")
            return
        }

        guard PlaybackController.shared.isPlaying else { return }
        silentPlayingSeconds += 1

        if silentPlayingSeconds >= 6 {
            log("Effects capture is silent while Apple Music plays; assuming audio capture isn't allowed")
            captureBlocked = true
            lastError = "FocalSonic needs permission to capture Apple Music's audio for effects. Allow it under System Settings > Privacy & Security > Screen & System Audio Recording."
            deactivate()
            report()
        }
    }

    // MARK: Render configuration

    private func push() {
        guard let sampleRate = tap?.sampleRate else { return }

        var dsp = DSPSettings()
        dsp.bands = settings.bands.prefix(DSPChain.maxBands).map { BiquadCoefficients(band: $0, sampleRate: sampleRate) }
        dsp.gain = Float(max(0, min(settings.gain, 1)))
        dsp.wet = Float(max(0, min(settings.reverb, 1)))
        if dsp.wet > 0 { dsp.reverb = reverb(path: settings.impulsePath, sampleRate: sampleRate) }

        if abs(settings.pitch - 1) > 0.0005 {
            // NewTimePitch accepts +/- 2 octaves.
            dsp.pitchCents = Float(max(-2400, min(2400, 1200 * log2(settings.pitch))))
        }

        chain.configure(dsp)
    }

    private func reverb(path: String?, sampleRate: Double) -> ConvolutionReverb? {
        // Keyed by what was asked for, so a fallback isn't rebuilt (and its tail cut) on every push.
        if let reverb, reverbPath == path, reverb.sampleRate == sampleRate { return reverb }
        reverbPath = path

        let impulse: ImpulseResponse
        do {
            guard let path else { throw HelperError("no impulse response was given") }
            impulse = try ImpulseResponse.load(path: path, sampleRate: sampleRate)
        } catch {
            log("Using a synthetic impulse response: \(error.localizedDescription)")
            impulse = .synthetic(sampleRate: sampleRate)
        }

        let replacement = ConvolutionReverb(impulse: impulse, maxFrames: chain.maxFrames)

        // The render thread may still hold the old one for a cycle; free it later, here.
        if let previous = reverb {
            DispatchQueue.main.asyncAfter(deadline: .now() + 2) { _ = previous }
        }
        reverb = replacement
        return replacement
    }

    private func report() {
        var fields: [String: Any] = ["active": isActive]
        if let lastError { fields["error"] = lastError }
        IPC.event("effects", fields)
    }
}
