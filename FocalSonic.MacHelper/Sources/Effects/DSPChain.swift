import Accelerate
import Foundation
import os

/// Everything the render thread needs for one configuration. Built on the main thread.
struct DSPSettings {
    var bands: [BiquadCoefficients] = []
    var reverb: ConvolutionReverb?
    /// Web Audio wiring from FocalMK: the wet path is scaled by `wet`, the dry by 1 - wet.
    var wet: Float = 0
    /// Linear output gain (FocalSonic's volume curve is applied by the host).
    var gain: Float = 1
    var pitchCents: Float = 0
}

/// The processing graph FocalMK builds with Web Audio, on captured audio:
///   capture -> pitch shift (varispeed) -> EQ bands -> dry + convolution reverb -> gain -> limiter
/// The limiter has no Web Audio counterpart: there, the browser and OS deal with overs.
/// `process` runs on the real-time IO thread: it never allocates, blocks or logs.
final class DSPChain {
    static let maxBands = 64
    let maxFrames = 4096

    /// Stereo working buffers. The IO proc fills them, calls `process`, then reads them back.
    let left: UnsafeMutablePointer<Float>
    let right: UnsafeMutablePointer<Float>

    private let wetLeft: UnsafeMutablePointer<Float>
    private let wetRight: UnsafeMutablePointer<Float>
    private let filterState: UnsafeMutablePointer<BiquadState>   // [channel * maxBands + band]

    // Render thread only.
    private var current = DSPSettings()
    private var activeBands = 0
    private var reverbRunning = false
    private var pitchRunning = false
    private var gain: Float = 1
    private var fade: Float = 1
    private var fadeTarget: Float = 1
    private var fadeSeconds: Float = 0
    private var sampleRate = 48000.0
    private var pitch: PitchShifter?
    private var limiter: PeakLimiter?

    private struct Shared {
        var pending: DSPSettings?
        var hasPending = false
        var fadeTarget: Float = 1
        var fadeSeconds: Float = 0
        var fadeSnap = false
        var peak: Float = 0
    }
    private let shared = OSAllocatedUnfairLock(initialState: Shared())

    init() {
        func buffer() -> UnsafeMutablePointer<Float> {
            let pointer = UnsafeMutablePointer<Float>.allocate(capacity: 4096)
            pointer.initialize(repeating: 0, count: 4096)
            return pointer
        }
        left = buffer()
        right = buffer()
        wetLeft = buffer()
        wetRight = buffer()
        filterState = .allocate(capacity: 2 * Self.maxBands)
        filterState.initialize(repeating: BiquadState(), count: 2 * Self.maxBands)
    }

    deinit {
        [left, right, wetLeft, wetRight].forEach { $0.deallocate() }
        filterState.deallocate()
    }

    // MARK: Main thread

    /// Must be called (off the IO thread) before a capture session starts using the chain.
    func prepare(sampleRate: Double) {
        if pitch == nil || abs(self.sampleRate - sampleRate) > 0.5 {
            pitch = PitchShifter(sampleRate: sampleRate, maxFrames: maxFrames)
        }
        if let limiter, abs(self.sampleRate - sampleRate) <= 0.5 {
            limiter.reset()
        } else {
            limiter = PeakLimiter(sampleRate: sampleRate)
        }
        self.sampleRate = sampleRate
        filterState.update(repeating: BiquadState(), count: 2 * Self.maxBands)
        activeBands = 0
        reverbRunning = false
        pitchRunning = false
        gain = current.gain
    }

    /// Hands a new configuration to the render thread. The previous one comes back through
    /// `pending`, so whatever it owned is released here rather than on the IO thread.
    func configure(_ settings: DSPSettings) {
        shared.withLock { state in
            state.pending = settings
            state.hasPending = true
        }
    }

    /// Ramps the output to `level` (0...1) over `seconds`; 0 seconds jumps straight there.
    func fade(to level: Float, seconds: Float) {
        shared.withLock { state in
            state.fadeTarget = level
            state.fadeSeconds = seconds
            state.fadeSnap = seconds <= 0
        }
    }

    /// The loudest captured sample since the last call.
    func takePeak() -> Float {
        shared.withLock { state in
            defer { state.peak = 0 }
            return state.peak
        }
    }

    // MARK: Render thread

    func process(frames: Int) {
        let count = min(frames, maxFrames)
        let length = vDSP_Length(count)

        var inputPeak: Float = 0
        var rightPeak: Float = 0
        vDSP_maxmgv(left, 1, &inputPeak, length)
        vDSP_maxmgv(right, 1, &rightPeak, length)
        inputPeak = max(inputPeak, rightPeak)

        // Never wait for the main thread: if it holds the lock, keep last cycle's settings.
        let peak = inputPeak
        let previous = current
        let control = shared.withLockIfAvailable { state -> Control in
            state.peak = max(state.peak, peak)
            var control = Control(fadeTarget: state.fadeTarget, fadeSeconds: state.fadeSeconds, snap: state.fadeSnap)
            state.fadeSnap = false
            if state.hasPending, let pending = state.pending {
                control.incoming = pending
                // The outgoing settings are released by the main thread's next `configure`.
                state.pending = previous
                state.hasPending = false
            }
            return control
        }

        if let control {
            if let incoming = control.incoming { current = incoming }
            if control.snap { fade = control.fadeTarget }
            fadeTarget = control.fadeTarget
            fadeSeconds = control.fadeSeconds
        }

        applyPitch(count)
        applyEQ(count)
        applyReverb(count)
        applyGain(count)
        limiter?.process(left, right, count: count)
    }

    private struct Control: @unchecked Sendable {
        var fadeTarget: Float
        var fadeSeconds: Float
        var snap: Bool
        var incoming: DSPSettings?
    }

    private func applyPitch(_ count: Int) {
        guard let pitch else { return }
        guard abs(current.pitchCents) > 0.5 else {
            pitchRunning = false
            return
        }

        if !pitchRunning {
            pitch.reset()
            pitchRunning = true
        }
        pitch.setPitch(cents: current.pitchCents)
        pitch.process(left, right, count: count)
    }

    private func applyEQ(_ count: Int) {
        let bands = min(current.bands.count, Self.maxBands)

        // Newly added bands start from rest instead of a stale state.
        if bands > activeBands {
            for band in activeBands..<bands {
                filterState[band] = BiquadState()
                filterState[Self.maxBands + band] = BiquadState()
            }
        }
        activeBands = bands

        for band in 0..<bands {
            let coefficients = current.bands[band]
            filterState[band].process(left, count: count, coefficients)
            filterState[Self.maxBands + band].process(right, count: count, coefficients)
        }
    }

    private func applyReverb(_ count: Int) {
        guard current.wet > 0.0001, let reverb = current.reverb else {
            reverbRunning = false
            return
        }

        // Don't replay a tail left over from the last time the reverb was on.
        if !reverbRunning {
            reverb.reset()
            reverbRunning = true
        }

        reverb.process(inLeft: left, inRight: right, outLeft: wetLeft, outRight: wetRight, count: count)

        var wet = current.wet
        var dry = 1 - current.wet
        let length = vDSP_Length(count)
        vDSP_vsmsma(left, 1, &dry, wetLeft, 1, &wet, left, 1, length)
        vDSP_vsmsma(right, 1, &dry, wetRight, 1, &wet, right, 1, length)
    }

    private func applyGain(_ count: Int) {
        let target = current.gain
        if gain == target && fade == fadeTarget {
            guard gain != 1 || fade != 1 else { return }
            var scale = gain * fade
            vDSP_vsmul(left, 1, &scale, left, 1, vDSP_Length(count))
            vDSP_vsmul(right, 1, &scale, right, 1, vDSP_Length(count))
            return
        }

        // Volume changes glide over ~20 ms; fades are linear over the requested time.
        let smoothing = Float(1 - exp(-1 / (0.02 * sampleRate)))
        let fadeStep = fadeSeconds > 0 ? 1 / (fadeSeconds * Float(sampleRate)) : 1

        for frame in 0..<count {
            gain += (target - gain) * smoothing
            if fade < fadeTarget { fade = min(fadeTarget, fade + fadeStep) }
            else if fade > fadeTarget { fade = max(fadeTarget, fade - fadeStep) }
            let scale = gain * fade
            left[frame] *= scale
            right[frame] *= scale
        }

        if abs(gain - target) < 0.0001 { gain = target }
    }
}
