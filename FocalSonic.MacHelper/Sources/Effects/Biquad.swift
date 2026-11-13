import Foundation

/// The filter types FocalSonic's effects UI produces. Names follow FocalMK's `mapType`
/// (FocalMK/src/playback/audio-effects.js) so imported configs behave identically.
enum FilterType {
    case peaking, lowpass, highpass, lowshelf, highshelf, bandpass, notch, allpass

    init(name: String?) {
        switch (name ?? "").uppercased() {
        case "LOWPASS", "LPF": self = .lowpass
        case "HIGHPASS", "HPF": self = .highpass
        case "LOWSHELF", "LSHELF": self = .lowshelf
        case "HIGHSHELF", "HSHELF": self = .highshelf
        case "BANDPASS": self = .bandpass
        case "NOTCH", "BANDSTOP": self = .notch
        case "ALLPASS": self = .allpass
        default: self = .peaking
        }
    }

    /// Peaks and shelves only colour the sound through their gain, so at 0 dB they're a no-op.
    var isGainOnly: Bool { self == .peaking || self == .lowshelf || self == .highshelf }
}

struct EQBand: Equatable {
    var type: FilterType
    var frequency: Double
    var gain: Double
    var q: Double

    var isNeutral: Bool { type.isGainOnly && abs(gain) < 0.01 }
}

/// Normalised (a0 = 1) biquad coefficients.
struct BiquadCoefficients {
    var b0: Double, b1: Double, b2: Double, a1: Double, a2: Double

    static let identity = BiquadCoefficients(b0: 1, b1: 0, b2: 0, a1: 0, a2: 0)
    static let silence = BiquadCoefficients(b0: 0, b1: 0, b2: 0, a1: 0, a2: 0)

    private static func gain(_ value: Double) -> BiquadCoefficients {
        BiquadCoefficients(b0: value, b1: 0, b2: 0, a1: 0, a2: 0)
    }

    private init(b0: Double, b1: Double, b2: Double, a1: Double, a2: Double) {
        (self.b0, self.b1, self.b2, self.a1, self.a2) = (b0, b1, b2, a1, a2)
    }

    private init(_ b0: Double, _ b1: Double, _ b2: Double, _ a0: Double, _ a1: Double, _ a2: Double) {
        self.init(b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0)
    }

    /// Coefficients for a Web Audio BiquadFilterNode, including the edge cases Chromium and
    /// WebKit special-case, so EQ presets sound the same here as in the web player.
    /// https://webaudio.github.io/web-audio-api/#filters-characteristics
    init(band: EQBand, sampleRate: Double) {
        let nyquist = sampleRate / 2
        // FocalMK clamps the frequency to [10, nyquist] and Q to at least 0.0001.
        let normalised = min(max(band.frequency, 10), nyquist) / nyquist
        let q = max(band.q, 0.0001)
        let A = pow(10, band.gain / 40)

        switch band.type {
        case .lowpass:
            // Q is a resonance in dB for the pass filters.
            if normalised >= 1 { self = .identity; return }
            let theta = Double.pi * normalised
            let alpha = sin(theta) / (2 * pow(10, q / 20))
            let cosw = cos(theta)
            let beta = (1 - cosw) / 2
            self.init(beta, 2 * beta, beta, 1 + alpha, -2 * cosw, 1 - alpha)

        case .highpass:
            if normalised >= 1 { self = .silence; return }
            let theta = Double.pi * normalised
            let alpha = sin(theta) / (2 * pow(10, q / 20))
            let cosw = cos(theta)
            let beta = (1 + cosw) / 2
            self.init(beta, -2 * beta, beta, 1 + alpha, -2 * cosw, 1 - alpha)

        case .peaking:
            if normalised >= 1 { self = .identity; return }
            let w0 = Double.pi * normalised
            let alpha = sin(w0) / (2 * q)
            let k = cos(w0)
            self.init(1 + alpha * A, -2 * k, 1 - alpha * A, 1 + alpha / A, -2 * k, 1 - alpha / A)

        case .lowshelf:
            if normalised >= 1 { self = .gain(A * A); return }
            let (k, k2) = Self.shelf(normalised, A)
            let (plus, minus) = (A + 1, A - 1)
            self.init(A * (plus - minus * k + k2), 2 * A * (minus - plus * k), A * (plus - minus * k - k2),
                      plus + minus * k + k2, -2 * (minus + plus * k), plus + minus * k - k2)

        case .highshelf:
            if normalised >= 1 { self = .identity; return }
            let (k, k2) = Self.shelf(normalised, A)
            let (plus, minus) = (A + 1, A - 1)
            self.init(A * (plus + minus * k + k2), -2 * A * (minus + plus * k), A * (plus + minus * k - k2),
                      plus - minus * k + k2, 2 * (minus - plus * k), plus - minus * k - k2)

        case .bandpass:
            if normalised >= 1 { self = .silence; return }
            let w0 = Double.pi * normalised
            let alpha = sin(w0) / (2 * q)
            self.init(alpha, 0, -alpha, 1 + alpha, -2 * cos(w0), 1 - alpha)

        case .notch:
            if normalised >= 1 { self = .identity; return }
            let w0 = Double.pi * normalised
            let alpha = sin(w0) / (2 * q)
            let k = cos(w0)
            self.init(1, -2 * k, 1, 1 + alpha, -2 * k, 1 - alpha)

        case .allpass:
            if normalised >= 1 { self = .identity; return }
            let w0 = Double.pi * normalised
            let alpha = sin(w0) / (2 * q)
            let k = cos(w0)
            self.init(1 - alpha, -2 * k, 1 + alpha, 1 + alpha, -2 * k, 1 - alpha)
        }
    }

    /// Shelf slope is fixed at S = 1 in Web Audio.
    private static func shelf(_ normalised: Double, _ A: Double) -> (k: Double, k2: Double) {
        let w0 = Double.pi * normalised
        let alpha = 0.5 * sin(w0) * sqrt(2.0)
        return (cos(w0), 2 * sqrt(A) * alpha)
    }
}

/// Transposed direct form II state for one band on one channel. Double precision keeps
/// low frequency bands (31 Hz at 48 kHz) clean.
struct BiquadState {
    var z1 = 0.0
    var z2 = 0.0

    @inline(__always)
    mutating func process(_ buffer: UnsafeMutablePointer<Float>, count: Int, _ c: BiquadCoefficients) {
        var z1 = self.z1, z2 = self.z2
        for i in 0..<count {
            let x = Double(buffer[i])
            let y = c.b0 * x + z1
            z1 = c.b1 * x - c.a1 * y + z2
            z2 = c.b2 * x - c.a2 * y
            buffer[i] = Float(y)
        }
        // Flush denormals once the tail has decayed.
        if abs(z1) < 1e-25 { z1 = 0 }
        if abs(z2) < 1e-25 { z2 = 0 }
        self.z1 = z1
        self.z2 = z2
    }
}
