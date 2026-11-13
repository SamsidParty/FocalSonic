import Foundation

/// `FocalSonicHelper --self-test` checks the DSP maths against reference implementations,
/// without touching any audio hardware.
enum SelfTest {
    static func run() -> Bool {
        var passed = true
        func check(_ name: String, _ condition: Bool, _ detail: String) {
            print("\(condition ? "PASS" : "FAIL")  \(name)  \(detail)")
            passed = passed && condition
        }

        // Partitioned convolution must equal direct convolution, delayed by one block,
        // whatever sizes the IO thread hands it.
        for blockSize in [512, 1024] {
            let impulse = (0..<3001).map { _ in Float.random(in: -1...1) }
            let input = (0..<9000).map { _ in Float.random(in: -1...1) }
            let convolver = PartitionedConvolver(impulse: impulse, blockSize: blockSize)!

            var output = [Float](repeating: 0, count: input.count)
            var position = 0
            let chunks = [100, 333, 512, 7, 1024, 2048]
            var chunk = 0
            while position < input.count {
                let count = min(chunks[chunk % chunks.count], input.count - position)
                input.withUnsafeBufferPointer { source in
                    output.withUnsafeMutableBufferPointer { destination in
                        convolver.process(source.baseAddress! + position, destination.baseAddress! + position, count: count)
                    }
                }
                position += count
                chunk += 1
            }

            var worst: Float = 0
            for n in stride(from: blockSize, to: input.count, by: 37) {
                let source = n - blockSize
                var expected: Float = 0
                for k in 0..<min(impulse.count, source + 1) { expected += impulse[k] * input[source - k] }
                worst = max(worst, abs(expected - output[n]))
            }
            check("convolution (block \(blockSize))", worst < 0.01, "max error \(worst)")
        }

        // Biquad magnitudes at the points the Web Audio definitions pin down.
        let rate = 48000.0
        func magnitude(_ band: EQBand, at frequency: Double) -> Double {
            let c = BiquadCoefficients(band: band, sampleRate: rate)
            let w = 2 * Double.pi * frequency / rate
            let (cos1, sin1, cos2, sin2) = (cos(w), sin(w), cos(2 * w), sin(2 * w))
            let numerator = hypot(c.b0 + c.b1 * cos1 + c.b2 * cos2, -(c.b1 * sin1 + c.b2 * sin2))
            let denominator = hypot(1 + c.a1 * cos1 + c.a2 * cos2, -(c.a1 * sin1 + c.a2 * sin2))
            return 20 * log10(numerator / denominator)
        }

        let peak = magnitude(EQBand(type: .peaking, frequency: 1000, gain: 6, q: 1.41), at: 1000)
        check("peaking +6 dB @ 1 kHz", abs(peak - 6) < 0.01, "\(peak) dB")

        let resonance = magnitude(EQBand(type: .lowpass, frequency: 2000, gain: 0, q: 6), at: 2000)
        check("lowpass Q is resonance in dB", abs(resonance - 6) < 0.05, "\(resonance) dB")

        let shelf = magnitude(EQBand(type: .lowshelf, frequency: 200, gain: -12, q: 1), at: 20)
        check("lowshelf -12 dB deep in the shelf", abs(shelf + 12) < 0.5, "\(shelf) dB")

        let flat = magnitude(EQBand(type: .highshelf, frequency: 8000, gain: 0, q: 1), at: 3000)
        check("0 dB shelf is flat", abs(flat) < 0.0001, "\(flat) dB")

        let notch = magnitude(EQBand(type: .notch, frequency: 5000, gain: 0, q: 2), at: 5000)
        check("notch rejects its centre", notch < -60, "\(notch) dB")

        // The pitch unit must produce sound once primed.
        if let shifter = PitchShifter(sampleRate: rate, maxFrames: 4096) {
            shifter.setPitch(cents: 700)
            let left = UnsafeMutablePointer<Float>.allocate(capacity: 512)
            let right = UnsafeMutablePointer<Float>.allocate(capacity: 512)
            defer { left.deallocate(); right.deallocate() }

            // +700 cents takes 440 Hz to ~659 Hz; count zero crossings once it has settled.
            var crossings = 0
            var previous: Float = 0
            var phase = 0.0
            let blocks = 60, measured = 30
            for block in 0..<blocks {
                for i in 0..<512 {
                    left[i] = Float(sin(phase)); right[i] = left[i]
                    phase += 2 * Double.pi * 440 / rate
                }
                shifter.process(left, right, count: 512)
                guard block >= blocks - measured else { continue }
                for i in 0..<512 {
                    if (previous < 0) != (left[i] < 0) { crossings += 1 }
                    previous = left[i]
                }
            }
            let frequency = Double(crossings) / 2 / (Double(measured * 512) / rate)
            check("pitch shift +700 cents", abs(frequency - 659.3) < 15, "\(Int(frequency)) Hz from 440 Hz")
        } else {
            check("pitch shifter output", false, "couldn't create NewTimePitch")
        }

        // The same through the whole chain, including the settings hand-off to the render side.
        let chain = DSPChain()
        chain.prepare(sampleRate: rate)
        var settings = DSPSettings()
        settings.pitchCents = 700
        settings.gain = 0.5
        chain.configure(settings)

        var chainCrossings = 0
        var chainPrevious: Float = 0
        var chainPeak: Float = 0
        var chainPhase = 0.0
        for block in 0..<60 {
            for i in 0..<512 {
                chain.left[i] = Float(sin(chainPhase)); chain.right[i] = chain.left[i]
                chainPhase += 2 * Double.pi * 440 / rate
            }
            chain.process(frames: 512)
            guard block >= 30 else { continue }
            for i in 0..<512 {
                if (chainPrevious < 0) != (chain.left[i] < 0) { chainCrossings += 1 }
                chainPrevious = chain.left[i]
                chainPeak = max(chainPeak, abs(chain.left[i]))
            }
        }
        let chainFrequency = Double(chainCrossings) / 2 / (Double(30 * 512) / rate)
        check("chain pitch + gain", abs(chainFrequency - 659.3) < 15 && abs(chainPeak - 0.5) < 0.1,
              "\(Int(chainFrequency)) Hz, peak \(chainPeak)")

        return passed
    }
}
