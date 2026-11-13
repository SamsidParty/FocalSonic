import Accelerate
import AudioToolbox
import CoreAudio
import Foundation

/// Catalog audio is FairPlay protected and decoded outside this process, so there's no
/// stream to insert effects into. Instead the rendered audio is captured with a Core Audio
/// process tap (which also mutes the original), run through the DSP chain and played out of
/// the default output device, all inside one private aggregate device's IO proc:
///
///   MusicKit renderer --(tap, muted)--> aggregate [tap in | output device out] --> DSPChain
final class ProcessTap {
    /// MusicKit renders ApplicationMusicPlayer audio in this per-client XPC service. Only our
    /// instance of it is tapped, so nothing else on the system is touched. (This process must
    /// never be tapped: it's the one playing the processed audio.)
    static let rendererBundleIDs: Set<String> = ["com.apple.MediaPlayer.RemotePlayerService"]

    let sampleRate: Double
    /// Called on the main queue when the output device or tapped processes change and the
    /// capture has to be rebuilt.
    var onInvalidated: (() -> Void)?

    private let chain: DSPChain
    private var tap = AudioObjectID(kAudioObjectUnknown)
    private var aggregate = AudioObjectID(kAudioObjectUnknown)
    private var ioProc: AudioDeviceIOProcID?
    private var listeners: [AudioObjects.PropertyListener] = []
    private var tappedProcesses: Set<AudioObjectID> = []

    private let tapInterleaved: Bool
    private let tapChannels: Int
    private let tapBufferCount: Int
    private let outputInterleaved: Bool
    private let ioQueue = DispatchQueue(label: "com.samsidparty.focalsonic.effects", qos: .userInteractive)

    init(chain: DSPChain) throws {
        self.chain = chain

        // 1. The tap. If the renderer is relaunched later, `watchForChanges` rebuilds this.
        let processes = AudioObjects.ownProcessObjects(bundleIDs: Self.rendererBundleIDs)
        tappedProcesses = Set(processes)
        let description = CATapDescription(stereoMixdownOfProcesses: processes)
        description.name = "FocalSonic Effects"
        description.isPrivate = true
        description.muteBehavior = .muted

        var tap = AudioObjectID(kAudioObjectUnknown)
        let tapStatus = AudioHardwareCreateProcessTap(description, &tap)
        guard tapStatus == noErr, tap != AudioObjectID(kAudioObjectUnknown) else {
            throw HelperError("macOS refused to capture Apple Music's audio (\(tapStatus)). Allow FocalSonic to record system audio in System Settings > Privacy & Security.")
        }
        self.tap = tap

        guard let tapFormat = AudioObjects.value(tap, kAudioTapPropertyFormat, initial: AudioStreamBasicDescription()),
              tapFormat.mFormatID == kAudioFormatLinearPCM, tapFormat.mFormatFlags & kAudioFormatFlagIsFloat != 0,
              tapFormat.mBitsPerChannel == 32 else {
            AudioHardwareDestroyProcessTap(tap)
            throw HelperError("Apple Music's audio is in a format the effects engine can't process")
        }
        sampleRate = tapFormat.mSampleRate
        tapChannels = max(1, Int(tapFormat.mChannelsPerFrame))
        tapInterleaved = tapFormat.mFormatFlags & kAudioFormatFlagIsNonInterleaved == 0
        tapBufferCount = tapInterleaved ? 1 : tapChannels

        // 2. A private aggregate device clocked by the output device, with the tap as input.
        guard let outputDevice = AudioObjects.defaultOutputDevice, let outputUID = AudioObjects.deviceUID(outputDevice) else {
            AudioHardwareDestroyProcessTap(tap)
            throw HelperError("There's no audio output device")
        }

        let configuration: [String: Any] = [
            kAudioAggregateDeviceNameKey: "FocalSonic Effects",
            kAudioAggregateDeviceUIDKey: "com.samsidparty.focalsonic.effects.\(UUID().uuidString)",
            kAudioAggregateDeviceIsPrivateKey: true,
            kAudioAggregateDeviceIsStackedKey: false,
            kAudioAggregateDeviceTapAutoStartKey: true,
            kAudioAggregateDeviceMainSubDeviceKey: outputUID,
            kAudioAggregateDeviceSubDeviceListKey: [[kAudioSubDeviceUIDKey: outputUID]],
            kAudioAggregateDeviceTapListKey: [[
                kAudioSubTapUIDKey: description.uuid.uuidString,
                kAudioSubTapDriftCompensationKey: true,
            ]],
        ]

        var aggregate = AudioObjectID(kAudioObjectUnknown)
        let aggregateStatus = AudioHardwareCreateAggregateDevice(configuration as CFDictionary, &aggregate)
        guard aggregateStatus == noErr, aggregate != AudioObjectID(kAudioObjectUnknown) else {
            AudioHardwareDestroyProcessTap(tap)
            throw HelperError("Couldn't set up audio routing for effects (\(aggregateStatus))")
        }
        self.aggregate = aggregate

        guard let outputFormat = AudioObjects.streamFormat(aggregate, scope: kAudioObjectPropertyScopeOutput),
              outputFormat.mFormatFlags & kAudioFormatFlagIsFloat != 0, outputFormat.mBitsPerChannel == 32 else {
            AudioHardwareDestroyAggregateDevice(aggregate)
            AudioHardwareDestroyProcessTap(tap)
            throw HelperError("The output device uses a format the effects engine can't write")
        }
        outputInterleaved = outputFormat.mFormatFlags & kAudioFormatFlagIsNonInterleaved == 0

        // 3. Start processing.
        chain.prepare(sampleRate: sampleRate)

        var procID: AudioDeviceIOProcID?
        let procStatus = AudioDeviceCreateIOProcIDWithBlock(&procID, aggregate, ioQueue) { [unowned self] _, input, _, output, _ in
            self.render(input: input, output: output)
        }
        guard procStatus == noErr, let procID else {
            destroy()
            throw HelperError("Couldn't start effects processing (\(procStatus))")
        }
        ioProc = procID

        let startStatus = AudioDeviceStart(aggregate, procID)
        guard startStatus == noErr else {
            destroy()
            throw HelperError("Couldn't start effects processing (\(startStatus))")
        }

        watchForChanges()
        log("Effects capture started at \(Int(sampleRate)) Hz on \(outputUID)")
    }

    deinit { destroy() }

    /// Stops processing and releases the tap, which un-mutes the original audio.
    func destroy() {
        listeners.forEach { $0.remove() }
        listeners = []

        if let ioProc, aggregate != AudioObjectID(kAudioObjectUnknown) {
            AudioDeviceStop(aggregate, ioProc)
            AudioDeviceDestroyIOProcID(aggregate, ioProc)
        }
        ioProc = nil

        if aggregate != AudioObjectID(kAudioObjectUnknown) {
            AudioHardwareDestroyAggregateDevice(aggregate)
            aggregate = AudioObjectID(kAudioObjectUnknown)
        }
        if tap != AudioObjectID(kAudioObjectUnknown) {
            AudioHardwareDestroyProcessTap(tap)
            tap = AudioObjectID(kAudioObjectUnknown)
        }
    }

    private func watchForChanges() {
        let invalidate: () -> Void = { [weak self] in self?.onInvalidated?() }

        if let listener = AudioObjects.addListener(AudioObjects.system, kAudioHardwarePropertyDefaultOutputDevice, handler: invalidate) {
            listeners.append(listener)
        }
        if let device = AudioObjects.defaultOutputDevice,
           let listener = AudioObjects.addListener(device, kAudioDevicePropertyNominalSampleRate, handler: invalidate) {
            listeners.append(listener)
        }

        // A renderer that starts (or restarts) after the tap was made has to be tapped anew.
        let listener = AudioObjects.addListener(AudioObjects.system, kAudioHardwarePropertyProcessObjectList) { [weak self] in
            guard let self else { return }
            let current = Set(AudioObjects.ownProcessObjects(bundleIDs: Self.rendererBundleIDs))
            if !current.isSubset(of: self.tappedProcesses) { self.onInvalidated?() }
        }
        if let listener { listeners.append(listener) }
    }

    // MARK: IO thread

    private func render(input: UnsafePointer<AudioBufferList>, output: UnsafeMutablePointer<AudioBufferList>) {
        let inputs = UnsafeMutableAudioBufferListPointer(UnsafeMutablePointer(mutating: input))
        let outputs = UnsafeMutableAudioBufferListPointer(output)
        guard outputs.count > 0 else { return }

        let first = outputs[0]
        let outputChannels = max(1, Int(first.mNumberChannels))
        let frames = Int(first.mDataByteSize) / (MemoryLayout<Float>.size * (outputInterleaved ? outputChannels : 1))

        // The tap's stream follows any input streams of the output device itself.
        let tapStart = inputs.count - tapBufferCount

        var offset = 0
        while offset < frames {
            let count = min(frames - offset, chain.maxFrames)
            readTap(inputs, from: tapStart, offset: offset, count: count)
            chain.process(frames: count)
            writeOutput(outputs, offset: offset, count: count)
            offset += count
        }

        // Any further output buffers (extra channels or streams) stay silent.
        let used = outputInterleaved ? 1 : min(2, outputs.count)
        for index in used..<outputs.count where outputs[index].mData != nil {
            memset(outputs[index].mData, 0, Int(outputs[index].mDataByteSize))
        }
    }

    private func readTap(_ inputs: UnsafeMutableAudioBufferListPointer, from tapStart: Int, offset: Int, count: Int) {
        let left = chain.left, right = chain.right

        guard tapStart >= 0, let data = inputs[tapStart].mData?.assumingMemoryBound(to: Float.self) else {
            left.update(repeating: 0, count: count)
            right.update(repeating: 0, count: count)
            return
        }

        if tapInterleaved {
            let available = Int(inputs[tapStart].mDataByteSize) / (MemoryLayout<Float>.size * tapChannels) - offset
            let usable = max(0, min(count, available))
            for frame in 0..<usable {
                let base = (offset + frame) * tapChannels
                left[frame] = data[base]
                right[frame] = tapChannels > 1 ? data[base + 1] : data[base]
            }
            if usable < count {
                (left + usable).update(repeating: 0, count: count - usable)
                (right + usable).update(repeating: 0, count: count - usable)
            }
        } else {
            let secondIndex = tapChannels > 1 ? tapStart + 1 : tapStart
            let second = inputs[secondIndex].mData?.assumingMemoryBound(to: Float.self) ?? data
            left.update(from: data + offset, count: count)
            right.update(from: second + offset, count: count)
        }
    }

    private func writeOutput(_ outputs: UnsafeMutableAudioBufferListPointer, offset: Int, count: Int) {
        let left = chain.left, right = chain.right
        let first = outputs[0]
        guard let data = first.mData?.assumingMemoryBound(to: Float.self) else { return }

        if outputInterleaved {
            let channels = max(1, Int(first.mNumberChannels))
            for frame in 0..<count {
                let base = (offset + frame) * channels
                if channels == 1 {
                    data[base] = 0.5 * (left[frame] + right[frame])
                } else {
                    data[base] = left[frame]
                    data[base + 1] = right[frame]
                    for extra in 2..<max(2, channels) { data[base + extra] = 0 }
                }
            }
        } else {
            // Non-interleaved devices expose one buffer per channel.
            (data + offset).update(from: left, count: count)
            if outputs.count > 1, let second = outputs[1].mData?.assumingMemoryBound(to: Float.self) {
                (second + offset).update(from: right, count: count)
            }
        }
    }
}
