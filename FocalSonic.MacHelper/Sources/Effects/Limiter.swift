import Foundation

/// A stereo-linked look-ahead peak limiter, the last stage of the chain.
///
/// Captured audio leaves the chain as float, and whatever goes past full scale is hard clipped
/// by the output device or the AirPlay encoder. Modern masters peak right at 0 dBFS, MusicKit's
/// time stretching (any speed but 1x) resynthesises them a few dB over it, and EQ boosts or
/// reverb add more, so without this the output clipped constantly. Audio that wouldn't clip
/// passes through bit for bit, only delayed by the look-ahead.
///
/// The gain is the lowest any sample in the look-ahead and hold windows needs, released with a
/// one-pole curve and then smoothed by a moving average as long as the look-ahead. The average
/// only ever spans gains that were held for the peak it reaches, so the gain has fully ramped
/// down by the time a peak comes out (no overs) and never steps (no clicks). The hold keeps the
/// gain steady between the peaks of sustained bass, where releasing would distort it.
final class PeakLimiter {
    /// Full scale: only what would otherwise be clipped is touched.
    static let ceiling: Float = 1

    /// How many frames the output lags the input.
    var latency: Int { lookAhead - 1 }

    private let lookAhead: Int
    private let span: Int                   // look-ahead + hold, in samples
    private let releaseDecay: Float

    // The delayed audio, a ring of `lookAhead` frames.
    private let delayLeft: UnsafeMutablePointer<Float>
    private let delayRight: UnsafeMutablePointer<Float>
    // Sliding minimum of the required gain over `span` samples: a monotonic queue in a ring.
    private let queueIndex: UnsafeMutablePointer<Int>
    private let queueGain: UnsafeMutablePointer<Float>
    private var queueStart = 0
    private var queueCount = 0
    // Moving average of the released gain over `lookAhead` samples.
    private let smoothing: UnsafeMutablePointer<Float>
    private var smoothingSum = 0.0
    private var smoothingReduced = 0        // entries below 1, so idle is exactly unity

    private var position = 0
    /// 1 - the released gain. Kept as the reduction because a slow release changes a gain near 1
    /// by less than a Float can resolve there, and it would never get back to unity.
    private var reduction: Float = 0

    init(sampleRate: Double, lookAheadSeconds: Double = 0.003, holdSeconds: Double = 0.025, releaseSeconds: Double = 0.1) {
        lookAhead = max(2, Int((lookAheadSeconds * sampleRate).rounded()))
        span = lookAhead + max(0, Int((holdSeconds * sampleRate).rounded()))
        releaseDecay = Float(exp(-1 / (releaseSeconds * sampleRate)))

        delayLeft = .allocate(capacity: lookAhead)
        delayRight = .allocate(capacity: lookAhead)
        smoothing = .allocate(capacity: lookAhead)
        queueIndex = .allocate(capacity: span)
        queueGain = .allocate(capacity: span)
        queueIndex.initialize(repeating: 0, count: span)
        queueGain.initialize(repeating: 1, count: span)
        delayLeft.initialize(repeating: 0, count: lookAhead)
        delayRight.initialize(repeating: 0, count: lookAhead)
        smoothing.initialize(repeating: 1, count: lookAhead)
        reset()
    }

    deinit {
        [delayLeft, delayRight, smoothing, queueGain].forEach { $0.deallocate() }
        queueIndex.deallocate()
    }

    /// Back to silence and unity gain. Real-time safe.
    func reset() {
        delayLeft.update(repeating: 0, count: lookAhead)
        delayRight.update(repeating: 0, count: lookAhead)
        smoothing.update(repeating: 1, count: lookAhead)
        smoothingSum = Double(lookAhead)
        smoothingReduced = 0
        queueStart = 0
        queueCount = 0
        position = 0
        reduction = 0
    }

    /// Limits `count` frames of `left`/`right` in place. Real-time safe.
    func process(_ left: UnsafeMutablePointer<Float>, _ right: UnsafeMutablePointer<Float>, count: Int) {
        let ceiling = Self.ceiling

        for frame in 0..<count {
            let inLeft = left[frame], inRight = right[frame]

            // What this sample needs, as the newest entry of the sliding minimum.
            let level = max(abs(inLeft), abs(inRight))
            let needed: Float = level > ceiling ? ceiling / level : 1
            while queueCount > 0, queueGain[(queueStart + queueCount - 1) % span] >= needed { queueCount -= 1 }
            let back = (queueStart + queueCount) % span
            queueIndex[back] = position
            queueGain[back] = needed
            queueCount += 1
            while queueIndex[queueStart] <= position - span {
                queueStart = (queueStart + 1) % span
                queueCount -= 1
            }
            let held = queueGain[queueStart]

            // Release towards unity, but never above what the window holds.
            reduction *= releaseDecay
            if reduction < 0.00001 { reduction = 0 } // Within 0.0001 dB: done releasing.
            reduction = max(reduction, 1 - held)
            let gain = 1 - reduction

            // Smooth it over the look-ahead.
            let slot = position % lookAhead
            let outgoing = smoothing[slot]
            if outgoing < 1 { smoothingReduced -= 1 }
            if gain < 1 { smoothingReduced += 1 }
            smoothing[slot] = gain
            smoothingSum += Double(gain) - Double(outgoing)
            let applied: Float
            if smoothingReduced == 0 {
                smoothingSum = Double(lookAhead) // No drift once idle.
                applied = 1
            } else {
                applied = Float(smoothingSum / Double(lookAhead))
            }

            // The sample from `lookAhead - 1` frames ago comes out now.
            delayLeft[slot] = inLeft
            delayRight[slot] = inRight
            let out = (position + 1) % lookAhead
            if applied == 1 {
                left[frame] = delayLeft[out]
                right[frame] = delayRight[out]
            } else {
                left[frame] = delayLeft[out] * applied
                right[frame] = delayRight[out] * applied
            }

            position += 1
        }
    }
}
