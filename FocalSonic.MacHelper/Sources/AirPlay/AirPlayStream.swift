import AVFoundation
import CoreMedia
import Foundation
import os

/// Sends the captured (and processed) audio to an AirPlay route. The IO thread drops each
/// cycle into a ring; a timer on this stream's queue turns it into sample buffers for an
/// AVSampleBufferAudioRenderer bound to the route's output context.
///
/// Capture runs on the Mac's audio clock and AirPlay on the speaker's, so the two drift apart
/// slowly. Rather than resampling, the queued audio is kept within bounds: a backlog is skipped
/// and a shortfall becomes a short gap, each smoothed with a fade-in. At typical clock accuracy
/// that's a correction every hour or two.
final class AirPlayStream {
    /// Called on the main queue if the renderer gives up (the route went away, for instance).
    var onFailure: ((String) -> Void)?

    private let renderer = AVSampleBufferAudioRenderer()
    private let synchronizer = AVSampleBufferRenderSynchronizer()
    private let ring = AudioRing(capacity: 1 << 17) // ~2.7 s at 48 kHz
    private let queue = DispatchQueue(label: "com.samsidparty.focalsonic.airplay", qos: .userInitiated)
    private var flushObserver: NSObjectProtocol?

    // Stream queue only.
    private var timer: DispatchSourceTimer?
    private var format: CMAudioFormatDescription?
    private var sampleRate: Double = 0
    private var nextFrame: Int64 = 0
    private var started = false
    private var fadeInRemaining = 0
    private var failed = false

    /// How far ahead of the speaker's clock audio is queued, and the bounds it's kept in.
    private let startLead = 0.3
    private let minimumLead = 0.03
    private let maximumLead = 1.0
    /// Audio waiting in the ring beyond this is skipped (the renderer isn't keeping up).
    private let maximumBacklog = 0.5
    private let fadeSeconds = 0.01

    init(context: OutputContext) throws {
        guard context.attach(renderer) else {
            throw HelperError("This version of macOS doesn't let FocalSonic play to AirPlay speakers")
        }
        synchronizer.addRenderer(renderer)

        // Route and format changes make the renderer drop what it has queued.
        flushObserver = NotificationCenter.default.addObserver(
            forName: .AVSampleBufferAudioRendererWasFlushedAutomatically, object: renderer, queue: nil
        ) { [weak self] _ in
            self?.queue.async { self?.reanchor() }
        }
    }

    deinit {
        if let flushObserver { NotificationCenter.default.removeObserver(flushObserver) }
    }

    /// Off the IO thread, before capture (re)starts. A new sample rate restarts the stream.
    func prepare(sampleRate: Double) {
        queue.sync {
            ring.reset()
            fadeInRemaining = fadeFrames(sampleRate)
            guard sampleRate != self.sampleRate || format == nil else {
                if started { reanchor() }
                return
            }

            self.sampleRate = sampleRate
            format = Self.makeFormat(sampleRate: sampleRate)
            if started {
                synchronizer.rate = 0
                renderer.flush()
            }
            started = false
            nextFrame = 0

            if timer == nil {
                let timer = DispatchSource.makeTimerSource(queue: queue)
                timer.schedule(deadline: .now(), repeating: .milliseconds(10), leeway: .milliseconds(2))
                timer.setEventHandler { [weak self] in self?.feed() }
                timer.resume()
                self.timer = timer
            }
        }
    }

    /// Stops sending (call once the IO proc has stopped writing).
    func stop() {
        queue.sync {
            timer?.cancel()
            timer = nil
            synchronizer.rate = 0
            renderer.flush()
            started = false
        }
        synchronizer.removeRenderer(renderer, at: .zero, completionHandler: nil)
    }

    // MARK: IO thread

    func write(left: UnsafePointer<Float>, right: UnsafePointer<Float>, count: Int) {
        ring.write(left: left, right: right, count: count)
    }

    // MARK: Stream queue

    private func feed() {
        guard let format, sampleRate > 0, !failed else { return }

        if renderer.status == .failed {
            failed = true
            let message = renderer.error?.localizedDescription ?? "The AirPlay connection was lost"
            log("AirPlay renderer failed: \(message)")
            DispatchQueue.main.async { [weak self] in self?.onFailure?(message) }
            return
        }

        if ring.available > Int(maximumBacklog * sampleRate) {
            ring.discard(keeping: Int(0.1 * sampleRate))
            fadeInRemaining = fadeFrames(sampleRate)
        }

        let now = started ? synchronizer.currentTime().seconds : 0
        if started, Double(nextFrame) / sampleRate < now + minimumLead {
            // Ran dry (or the speaker's clock is ahead): leave a short gap and carry on from there.
            reanchor()
        }

        while renderer.isReadyForMoreMediaData, Double(nextFrame) / sampleRate < now + maximumLead {
            let frames = min(ring.available, 2048)
            guard frames >= 128, let buffer = makeSampleBuffer(frames: frames, format: format) else { break }
            renderer.enqueue(buffer)
        }

        if !started, Double(nextFrame) / sampleRate >= startLead {
            synchronizer.setRate(1, time: .zero)
            started = true
        }
    }

    /// Restarts the timeline a little ahead of the speaker's clock.
    private func reanchor() {
        guard sampleRate > 0 else { return }
        let now = started ? synchronizer.currentTime().seconds : 0
        nextFrame = Int64(((now + startLead) * sampleRate).rounded())
        fadeInRemaining = fadeFrames(sampleRate)
    }

    private func makeSampleBuffer(frames: Int, format: CMAudioFormatDescription) -> CMSampleBuffer? {
        let bytes = frames * 2 * MemoryLayout<Float>.size
        var block: CMBlockBuffer?
        guard CMBlockBufferCreateWithMemoryBlock(allocator: kCFAllocatorDefault, memoryBlock: nil, blockLength: bytes,
                                                 blockAllocator: kCFAllocatorDefault, customBlockSource: nil,
                                                 offsetToData: 0, dataLength: bytes,
                                                 flags: kCMBlockBufferAssureMemoryNowFlag, blockBufferOut: &block) == noErr,
              let block else { return nil }

        var pointer: UnsafeMutablePointer<CChar>?
        guard CMBlockBufferGetDataPointer(block, atOffset: 0, lengthAtOffsetOut: nil, totalLengthOut: nil,
                                          dataPointerOut: &pointer) == noErr, let pointer else { return nil }

        let samples = UnsafeMutableRawPointer(pointer).bindMemory(to: Float.self, capacity: frames * 2)
        let read = ring.read(into: samples, frames: frames)
        if read < frames { (samples + read * 2).update(repeating: 0, count: (frames - read) * 2) }
        applyFadeIn(samples, frames: frames)

        var buffer: CMSampleBuffer?
        let time = CMTime(value: nextFrame, timescale: CMTimeScale(sampleRate.rounded()))
        guard CMAudioSampleBufferCreateReadyWithPacketDescriptions(allocator: kCFAllocatorDefault, dataBuffer: block,
                                                                  formatDescription: format, sampleCount: frames,
                                                                  presentationTimeStamp: time, packetDescriptions: nil,
                                                                  sampleBufferOut: &buffer) == noErr else { return nil }
        nextFrame += Int64(frames)
        return buffer
    }

    /// After a skip or a gap, ramp in rather than jump, so it doesn't click.
    private func applyFadeIn(_ samples: UnsafeMutablePointer<Float>, frames: Int) {
        guard fadeInRemaining > 0 else { return }
        let total = Float(fadeFrames(sampleRate))
        for frame in 0..<min(frames, fadeInRemaining) {
            let gain = 1 - Float(fadeInRemaining - frame) / total
            samples[frame * 2] *= gain
            samples[frame * 2 + 1] *= gain
        }
        fadeInRemaining = max(0, fadeInRemaining - frames)
    }

    private func fadeFrames(_ sampleRate: Double) -> Int { max(1, Int(fadeSeconds * sampleRate)) }

    private static func makeFormat(sampleRate: Double) -> CMAudioFormatDescription? {
        var description = AudioStreamBasicDescription(
            mSampleRate: sampleRate, mFormatID: kAudioFormatLinearPCM,
            mFormatFlags: kAudioFormatFlagIsFloat | kAudioFormatFlagIsPacked,
            mBytesPerPacket: 8, mFramesPerPacket: 1, mBytesPerFrame: 8,
            mChannelsPerFrame: 2, mBitsPerChannel: 32, mReserved: 0)
        var layout = AudioChannelLayout()
        layout.mChannelLayoutTag = kAudioChannelLayoutTag_Stereo

        var format: CMAudioFormatDescription?
        let status = CMAudioFormatDescriptionCreate(allocator: kCFAllocatorDefault, asbd: &description,
                                                    layoutSize: MemoryLayout<AudioChannelLayout>.size, layout: &layout,
                                                    magicCookieSize: 0, magicCookie: nil, extensions: nil,
                                                    formatDescriptionOut: &format)
        return status == noErr ? format : nil
    }
}

/// Interleaved stereo frames from one writer (the IO thread) to one reader. The writer never
/// waits: if the reader happens to hold the lock, or the ring is full, that cycle is dropped.
final class AudioRing {
    let capacity: Int
    private let mask: Int
    private let samples: UnsafeMutablePointer<Float>
    private let positions = OSAllocatedUnfairLock(initialState: Positions())

    private struct Positions {
        var written = 0
        var read = 0
    }

    init(capacity: Int) {
        precondition(capacity > 0 && capacity & (capacity - 1) == 0, "capacity must be a power of two")
        self.capacity = capacity
        mask = capacity - 1
        samples = .allocate(capacity: capacity * 2)
        samples.initialize(repeating: 0, count: capacity * 2)
    }

    deinit { samples.deallocate() }

    /// IO thread.
    func write(left: UnsafePointer<Float>, right: UnsafePointer<Float>, count: Int) {
        guard let start = positions.withLockIfAvailable({ $0 }) else { return }
        let frames = min(count, capacity - (start.written - start.read))
        guard frames > 0 else { return }

        var index = start.written & mask
        for frame in 0..<frames {
            samples[index * 2] = left[frame]
            samples[index * 2 + 1] = right[frame]
            index = (index + 1) & mask
        }
        _ = positions.withLockIfAvailable { $0.written = start.written + frames }
    }

    /// Frames waiting to be read.
    var available: Int {
        positions.withLock { $0.written - $0.read }
    }

    /// Copies up to `frames` interleaved frames out; returns how many there were.
    func read(into destination: UnsafeMutablePointer<Float>, frames: Int) -> Int {
        let start = positions.withLock { $0 }
        let count = min(frames, start.written - start.read)
        guard count > 0 else { return 0 }

        let first = start.read & mask
        let head = min(count, capacity - first)
        destination.update(from: samples + first * 2, count: head * 2)
        if head < count { (destination + head * 2).update(from: samples, count: (count - head) * 2) }

        positions.withLock { $0.read = start.read + count }
        return count
    }

    /// Drops the oldest frames, keeping the newest `frames`.
    func discard(keeping frames: Int) {
        positions.withLock { $0.read = max($0.read, $0.written - frames) }
    }

    /// Only while nothing is writing.
    func reset() {
        positions.withLock { $0 = Positions() }
    }
}
