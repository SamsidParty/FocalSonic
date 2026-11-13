import AVFoundation
import Accelerate
import Foundation

/// A decoded, resampled and normalised impulse response, ready for the convolver.
struct ImpulseResponse {
    let sourcePath: String?
    let sampleRate: Double
    let channels: [[Float]]

    var frameCount: Int { channels.first?.count ?? 0 }

    /// Longer responses than this cost more CPU than any room is worth.
    static let maxSeconds = 12.0

    /// Loads a wav (or anything Core Audio decodes) and conforms it to `sampleRate`.
    static func load(path: String, sampleRate: Double) throws -> ImpulseResponse {
        let file = try AVAudioFile(forReading: URL(fileURLWithPath: path))
        let format = file.processingFormat
        let frames = AVAudioFrameCount(min(Double(file.length), format.sampleRate * maxSeconds))

        guard frames > 0, format.channelCount > 0,
              let source = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frames) else {
            throw HelperError("The impulse response is empty")
        }
        try file.read(into: source, frameCount: frames)

        let buffer = try resample(source, to: sampleRate)
        guard let data = buffer.floatChannelData else { throw HelperError("The impulse response couldn't be decoded") }

        // Web Audio only accepts 1, 2 or 4 channel responses; anything else keeps its first two.
        let available = Int(buffer.format.channelCount)
        let used = available == 4 ? 4 : min(available, 2)
        let length = Int(buffer.frameLength)
        let channels = (0..<used).map { Array(UnsafeBufferPointer(start: data[$0], count: length)) }

        return ImpulseResponse(sourcePath: path, sampleRate: sampleRate, channels: normalise(channels, sampleRate: sampleRate))
    }

    /// FocalMK's fallback when an impulse response can't be loaded: three seconds of
    /// decaying noise.
    static func synthetic(sampleRate: Double) -> ImpulseResponse {
        let length = Int(sampleRate * 3)
        let channels = (0..<2).map { _ in
            (0..<length).map { i -> Float in
                let decay = 1 - Float(i) / Float(length)
                return Float.random(in: -1...1) * decay * decay
            }
        }
        return ImpulseResponse(sourcePath: nil, sampleRate: sampleRate, channels: normalise(channels, sampleRate: sampleRate))
    }

    private static func resample(_ buffer: AVAudioPCMBuffer, to sampleRate: Double) throws -> AVAudioPCMBuffer {
        let input = buffer.format
        guard abs(input.sampleRate - sampleRate) > 0.5 || input.commonFormat != .pcmFormatFloat32 || input.isInterleaved else {
            return buffer
        }

        guard let output = AVAudioFormat(commonFormat: .pcmFormatFloat32, sampleRate: sampleRate,
                                         channels: input.channelCount, interleaved: false),
              let converter = AVAudioConverter(from: input, to: output) else {
            throw HelperError("The impulse response's format isn't supported")
        }
        converter.sampleRateConverterQuality = AVAudioQuality.max.rawValue

        let capacity = AVAudioFrameCount(Double(buffer.frameLength) * sampleRate / input.sampleRate) + 1024
        guard let converted = AVAudioPCMBuffer(pcmFormat: output, frameCapacity: capacity) else {
            throw HelperError("Not enough memory to resample the impulse response")
        }

        var supplied = false
        var error: NSError?
        let status = converter.convert(to: converted, error: &error) { _, inputStatus in
            if supplied {
                inputStatus.pointee = .endOfStream
                return nil
            }
            supplied = true
            inputStatus.pointee = .haveData
            return buffer
        }

        if status == .error { throw error ?? HelperError("The impulse response couldn't be resampled") }
        return converted
    }

    /// Web Audio's ConvolverNode normalisation (`normalize = true`, the default that FocalMK
    /// relies on): scale by the inverse RMS power, calibrated to -58 dB and to 44.1 kHz.
    private static func normalise(_ channels: [[Float]], sampleRate: Double) -> [[Float]] {
        let length = channels.first?.count ?? 0
        guard length > 0 else { return channels }

        var power: Float = 0
        for channel in channels {
            var sumOfSquares: Float = 0
            vDSP_svesq(channel, 1, &sumOfSquares, vDSP_Length(length))
            power += sumOfSquares
        }

        power = sqrt(power / Float(channels.count * length))
        if !power.isFinite || power < 0.000125 { power = 0.000125 }

        var scale = (1 / power) * pow(10, -58.0 / 20) * Float(44100 / sampleRate)
        if channels.count == 4 { scale *= 0.5 }

        return channels.map { channel in
            var scaled = [Float](repeating: 0, count: length)
            vDSP_vsmul(channel, 1, &scale, &scaled, 1, vDSP_Length(length))
            return scaled
        }
    }
}
