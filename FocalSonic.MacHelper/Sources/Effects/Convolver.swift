import Accelerate
import Foundation

/// Uniformly partitioned overlap-save FFT convolution of one signal with one impulse
/// response channel. Everything is allocated up front, so `process` is real-time safe.
/// Output lags the input by `blockSize` samples, which reads as a little pre-delay on the
/// wet signal only.
final class PartitionedConvolver {
    let blockSize: Int

    private let fftSize: Int
    private let log2n: vDSP_Length
    private let setup: FFTSetup
    private let partitions: Int

    // Impulse response spectra, one block of `blockSize` split complex bins per partition.
    // vDSP's packed real FFT keeps DC in real[0] and Nyquist in imag[0].
    private let irReal: UnsafeMutablePointer<Float>
    private let irImag: UnsafeMutablePointer<Float>
    // Frequency domain delay line of recent input spectra (a ring of `partitions` blocks).
    private let lineReal: UnsafeMutablePointer<Float>
    private let lineImag: UnsafeMutablePointer<Float>
    private var lineHead = 0

    private let window: UnsafeMutablePointer<Float>     // last 2 blocks of input
    private let accReal: UnsafeMutablePointer<Float>
    private let accImag: UnsafeMutablePointer<Float>
    private let timeScratch: UnsafeMutablePointer<Float>

    // Arbitrary IOProc sizes are re-blocked through these.
    private let pendingInput: UnsafeMutablePointer<Float>
    private let readyOutput: UnsafeMutablePointer<Float>
    private var fill = 0

    init?(impulse: [Float], blockSize: Int) {
        guard !impulse.isEmpty, blockSize >= 64, blockSize & (blockSize - 1) == 0 else { return nil }

        self.blockSize = blockSize
        fftSize = blockSize * 2
        log2n = vDSP_Length(log2(Double(fftSize)))
        guard let setup = vDSP_create_fftsetup(log2n, FFTRadix(kFFTRadix2)) else { return nil }
        self.setup = setup
        partitions = (impulse.count + blockSize - 1) / blockSize

        func buffer(_ count: Int) -> UnsafeMutablePointer<Float> {
            let pointer = UnsafeMutablePointer<Float>.allocate(capacity: count)
            pointer.initialize(repeating: 0, count: count)
            return pointer
        }

        irReal = buffer(partitions * blockSize)
        irImag = buffer(partitions * blockSize)
        lineReal = buffer(partitions * blockSize)
        lineImag = buffer(partitions * blockSize)
        window = buffer(fftSize)
        accReal = buffer(blockSize)
        accImag = buffer(blockSize)
        timeScratch = buffer(fftSize)
        pendingInput = buffer(blockSize)
        readyOutput = buffer(blockSize)

        // vDSP's forward real FFT is 2x the textbook DFT and the inverse is N x, so a
        // forward/multiply/inverse round trip comes out 4N too loud. Fold that into the IR.
        var scale = 1 / Float(4 * fftSize)

        for partition in 0..<partitions {
            let start = partition * blockSize
            let count = min(blockSize, impulse.count - start)

            // Each IR partition is zero padded to the FFT size.
            timeScratch.update(repeating: 0, count: fftSize)
            impulse.withUnsafeBufferPointer { source in
                timeScratch.update(from: source.baseAddress! + start, count: count)
            }
            vDSP_vsmul(timeScratch, 1, &scale, timeScratch, 1, vDSP_Length(fftSize))
            forward(timeScratch, intoReal: irReal + start, imag: irImag + start)
        }
    }

    deinit {
        vDSP_destroy_fftsetup(setup)
        for pointer in [irReal, irImag, lineReal, lineImag, window, accReal, accImag, timeScratch, pendingInput, readyOutput] {
            pointer.deallocate()
        }
    }

    func reset() {
        lineReal.update(repeating: 0, count: partitions * blockSize)
        lineImag.update(repeating: 0, count: partitions * blockSize)
        window.update(repeating: 0, count: fftSize)
        readyOutput.update(repeating: 0, count: blockSize)
        fill = 0
    }

    /// Convolves `count` samples of `input` into `output` (which may alias `input`).
    func process(_ input: UnsafePointer<Float>, _ output: UnsafeMutablePointer<Float>, count: Int) {
        var done = 0
        while done < count {
            let chunk = min(count - done, blockSize - fill)
            (pendingInput + fill).update(from: input + done, count: chunk)
            (output + done).update(from: readyOutput + fill, count: chunk)
            fill += chunk
            done += chunk

            if fill == blockSize {
                processBlock()
                fill = 0
            }
        }
    }

    private func processBlock() {
        // Slide the input window: [previous block | new block].
        window.update(from: window + blockSize, count: blockSize)
        (window + blockSize).update(from: pendingInput, count: blockSize)

        // The newest input spectrum goes in at the head of the delay line.
        lineHead = (lineHead + partitions - 1) % partitions
        forward(window, intoReal: lineReal + lineHead * blockSize, imag: lineImag + lineHead * blockSize)

        // Sum input spectra against the matching IR partitions.
        accReal.update(repeating: 0, count: blockSize)
        accImag.update(repeating: 0, count: blockSize)
        let bins = vDSP_Length(blockSize - 1)

        for partition in 0..<partitions {
            let line = ((lineHead + partition) % partitions) * blockSize
            let ir = partition * blockSize

            // DC and Nyquist are packed into bin 0 and are purely real.
            accReal[0] += lineReal[line] * irReal[ir]
            accImag[0] += lineImag[line] * irImag[ir]

            var x = DSPSplitComplex(realp: lineReal + line + 1, imagp: lineImag + line + 1)
            var h = DSPSplitComplex(realp: irReal + ir + 1, imagp: irImag + ir + 1)
            // Accumulates in place: both views point at the same storage.
            var sum = DSPSplitComplex(realp: accReal + 1, imagp: accImag + 1)
            var result = sum
            vDSP_zvma(&x, 1, &h, 1, &sum, 1, &result, 1, bins)
        }

        // Back to the time domain; overlap-save keeps the second half.
        var spectrum = DSPSplitComplex(realp: accReal, imagp: accImag)
        vDSP_fft_zrip(setup, &spectrum, 1, log2n, FFTDirection(kFFTDirection_Inverse))
        timeScratch.withMemoryRebound(to: DSPComplex.self, capacity: blockSize) { interleaved in
            vDSP_ztoc(&spectrum, 1, interleaved, 2, vDSP_Length(blockSize))
        }
        readyOutput.update(from: timeScratch + blockSize, count: blockSize)
    }

    private func forward(_ signal: UnsafeMutablePointer<Float>, intoReal real: UnsafeMutablePointer<Float>,
                         imag: UnsafeMutablePointer<Float>) {
        var split = DSPSplitComplex(realp: real, imagp: imag)
        signal.withMemoryRebound(to: DSPComplex.self, capacity: blockSize) { interleaved in
            vDSP_ctoz(interleaved, 2, &split, 1, vDSP_Length(blockSize))
        }
        vDSP_fft_zrip(setup, &split, 1, log2n, FFTDirection(kFFTDirection_Forward))
    }
}

/// A stereo convolution reverb with Web Audio ConvolverNode channel routing:
/// mono IRs feed both channels, stereo IRs are applied per channel and 4 channel IRs are
/// treated as true stereo (LL, LR, RL, RR).
final class ConvolutionReverb {
    let sourcePath: String?
    let sampleRate: Double

    private let routes: [(input: Int, output: Int, convolver: PartitionedConvolver)]
    private let scratch: UnsafeMutablePointer<Float>
    private let maxFrames: Int

    init?(impulse: ImpulseResponse, maxFrames: Int) {
        let blockSize = impulse.frameCount > Int(impulse.sampleRate * 4) ? 1024 : 512
        let channels = impulse.channels

        let layout: [(input: Int, output: Int, channel: Int)]
        switch channels.count {
        case 1: layout = [(0, 0, 0), (1, 1, 0)]
        case 4: layout = [(0, 0, 0), (0, 1, 1), (1, 0, 2), (1, 1, 3)]
        default: layout = [(0, 0, 0), (1, 1, 1)]
        }

        var routes: [(input: Int, output: Int, convolver: PartitionedConvolver)] = []
        for route in layout {
            guard let convolver = PartitionedConvolver(impulse: channels[route.channel], blockSize: blockSize) else { return nil }
            routes.append((route.input, route.output, convolver))
        }

        self.routes = routes
        self.sourcePath = impulse.sourcePath
        self.sampleRate = impulse.sampleRate
        self.maxFrames = maxFrames
        scratch = .allocate(capacity: maxFrames)
        scratch.initialize(repeating: 0, count: maxFrames)
    }

    deinit { scratch.deallocate() }

    func reset() { routes.forEach { $0.convolver.reset() } }

    /// Writes the wet signal for a stereo input into a stereo output. Real-time safe.
    func process(inLeft: UnsafeMutablePointer<Float>, inRight: UnsafeMutablePointer<Float>,
                 outLeft: UnsafeMutablePointer<Float>, outRight: UnsafeMutablePointer<Float>, count: Int) {
        let count = min(count, maxFrames)
        outLeft.update(repeating: 0, count: count)
        outRight.update(repeating: 0, count: count)

        for route in routes {
            let input = route.input == 0 ? inLeft : inRight
            let output = route.output == 0 ? outLeft : outRight
            route.convolver.process(input, scratch, count: count)
            vDSP_vadd(scratch, 1, output, 1, output, 1, vDSP_Length(count))
        }
    }
}
