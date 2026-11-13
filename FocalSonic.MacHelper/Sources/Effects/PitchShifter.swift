import AudioToolbox
import Foundation

/// Shifts pitch without touching timing, using Apple's NewTimePitch unit at rate 1.
/// MusicKit only offers pitch-preserving speed changes; adding the matching pitch shift on
/// top gives varispeed (faster sounds higher), which is what the web player does with
/// `preservesPitch = false`.
final class PitchShifter {
    private var unit: AudioUnit?
    private let maxFrames: Int

    // The unit pulls input through a render callback, in whatever chunk sizes it likes, so
    // captured audio is queued in a ring that the callback drains.
    private static let ringCapacity = 1 << 15
    private let ring: [UnsafeMutablePointer<Float>]
    private var readIndex = 0
    private var writeIndex = 0
    private let primingFrames = 2048

    private let outputList: UnsafeMutableAudioBufferListPointer
    private var sampleTime = 0.0
    private var cents: Float = 0

    init?(sampleRate: Double, maxFrames: Int) {
        self.maxFrames = maxFrames
        ring = (0..<2).map { _ in
            let pointer = UnsafeMutablePointer<Float>.allocate(capacity: Self.ringCapacity)
            pointer.initialize(repeating: 0, count: Self.ringCapacity)
            return pointer
        }
        outputList = AudioBufferList.allocate(maximumBuffers: 2)

        var description = AudioComponentDescription(componentType: kAudioUnitType_FormatConverter,
                                                    componentSubType: kAudioUnitSubType_NewTimePitch,
                                                    componentManufacturer: kAudioUnitManufacturer_Apple,
                                                    componentFlags: 0, componentFlagsMask: 0)
        guard let component = AudioComponentFindNext(nil, &description) else { return nil }

        var instance: AudioUnit?
        guard AudioComponentInstanceNew(component, &instance) == noErr, let instance else { return nil }
        unit = instance

        var format = AudioStreamBasicDescription(
            mSampleRate: sampleRate, mFormatID: kAudioFormatLinearPCM,
            mFormatFlags: kAudioFormatFlagIsFloat | kAudioFormatFlagIsPacked | kAudioFormatFlagIsNonInterleaved,
            mBytesPerPacket: 4, mFramesPerPacket: 1, mBytesPerFrame: 4, mChannelsPerFrame: 2,
            mBitsPerChannel: 32, mReserved: 0)
        let formatSize = UInt32(MemoryLayout<AudioStreamBasicDescription>.size)
        var maxSlice = UInt32(maxFrames)
        var callback = AURenderCallbackStruct(inputProc: pitchShifterInput,
                                              inputProcRefCon: Unmanaged.passUnretained(self).toOpaque())

        let configured = AudioUnitSetProperty(instance, kAudioUnitProperty_StreamFormat, kAudioUnitScope_Input, 0, &format, formatSize) == noErr
            && AudioUnitSetProperty(instance, kAudioUnitProperty_StreamFormat, kAudioUnitScope_Output, 0, &format, formatSize) == noErr
            && AudioUnitSetProperty(instance, kAudioUnitProperty_MaximumFramesPerSlice, kAudioUnitScope_Global, 0, &maxSlice, 4) == noErr
            && AudioUnitSetProperty(instance, kAudioUnitProperty_SetRenderCallback, kAudioUnitScope_Input, 0, &callback,
                                    UInt32(MemoryLayout<AURenderCallbackStruct>.size)) == noErr
            && AudioUnitInitialize(instance) == noErr
        guard configured else { return nil }

        AudioUnitSetParameter(instance, kNewTimePitchParam_Rate, kAudioUnitScope_Global, 0, 1, 0)
        reset()
    }

    deinit {
        if let unit {
            AudioUnitUninitialize(unit)
            AudioComponentInstanceDispose(unit)
        }
        ring.forEach { $0.deallocate() }
        outputList.unsafeMutablePointer.deallocate()
    }

    /// Clears the queue and primes it with silence so the unit never runs dry while it fills
    /// its analysis window. Real-time safe.
    func reset() {
        if let unit { AudioUnitReset(unit, kAudioUnitScope_Global, 0) }
        for channel in ring { channel.update(repeating: 0, count: Self.ringCapacity) }
        readIndex = 0
        writeIndex = primingFrames
    }

    func setPitch(cents: Float) {
        guard let unit, cents != self.cents else { return }
        self.cents = cents
        AudioUnitSetParameter(unit, kNewTimePitchParam_Pitch, kAudioUnitScope_Global, 0, cents, 0)
    }

    /// Pitch shifts `count` frames of `left`/`right` in place.
    func process(_ left: UnsafeMutablePointer<Float>, _ right: UnsafeMutablePointer<Float>, count: Int) {
        guard let unit, count <= maxFrames else { return }

        // Queue the new input (dropping the oldest if the unit has stalled).
        if writeIndex - readIndex + count > Self.ringCapacity { readIndex = writeIndex + count - Self.ringCapacity }
        for frame in 0..<count {
            let slot = (writeIndex + frame) & (Self.ringCapacity - 1)
            ring[0][slot] = left[frame]
            ring[1][slot] = right[frame]
        }
        writeIndex += count

        let bytes = UInt32(count * MemoryLayout<Float>.size)
        outputList[0] = AudioBuffer(mNumberChannels: 1, mDataByteSize: bytes, mData: left)
        outputList[1] = AudioBuffer(mNumberChannels: 1, mDataByteSize: bytes, mData: right)

        var flags = AudioUnitRenderActionFlags()
        var timestamp = AudioTimeStamp()
        timestamp.mSampleTime = sampleTime
        timestamp.mFlags = .sampleTimeValid
        sampleTime += Double(count)

        if AudioUnitRender(unit, &flags, &timestamp, 0, UInt32(count), outputList.unsafeMutablePointer) != noErr {
            left.update(repeating: 0, count: count)
            right.update(repeating: 0, count: count)
        }
    }

    fileprivate func pull(frames: Int, into list: UnsafeMutablePointer<AudioBufferList>) {
        let buffers = UnsafeMutableAudioBufferListPointer(list)
        let available = max(0, min(frames, writeIndex - readIndex))

        for (channel, buffer) in buffers.enumerated() where channel < 2 {
            guard let destination = buffer.mData?.assumingMemoryBound(to: Float.self) else { continue }
            for frame in 0..<available {
                destination[frame] = ring[channel][(readIndex + frame) & (Self.ringCapacity - 1)]
            }
            if available < frames { (destination + available).update(repeating: 0, count: frames - available) }
        }
        readIndex += available
    }
}

private func pitchShifterInput(refCon: UnsafeMutableRawPointer,
                               flags: UnsafeMutablePointer<AudioUnitRenderActionFlags>,
                               timestamp: UnsafePointer<AudioTimeStamp>,
                               bus: UInt32, frames: UInt32,
                               data: UnsafeMutablePointer<AudioBufferList>?) -> OSStatus {
    guard let data else { return noErr }
    Unmanaged<PitchShifter>.fromOpaque(refCon).takeUnretainedValue().pull(frames: Int(frames), into: data)
    return noErr
}
