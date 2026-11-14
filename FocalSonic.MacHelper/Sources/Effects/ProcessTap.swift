import Accelerate
import AudioToolbox
import CoreAudio
import Foundation
import os

/// Catalog audio is FairPlay protected and decoded outside this process, so there's no
/// stream to insert effects into. Instead the rendered audio is captured with a Core Audio
/// process tap (which also mutes the original), run through the DSP chain and played out of
/// the default output device, all inside one private aggregate device's IO proc:
///
///   MusicKit renderer --(tap, muted)--> aggregate [tap in | output device out] --> DSPChain
///
/// With AirPlay on, the result goes to the AirPlay route instead and the output device is
/// left silent. FocalSonic itself is tapped too then, for music from servers other than Apple
/// Music (which it plays in-process, with its own volume), and is mixed in unprocessed:
///
///   MusicKit renderer --(tap)--> DSPChain --+--> AirPlayStream
///   FocalSonic host -----(tap)--------------+
final class ProcessTap {
    /// MusicKit renders ApplicationMusicPlayer audio in this per-client XPC service. Only our
    /// instance of it is tapped, so nothing else on the system is touched. (This process must
    /// never be tapped: it's the one playing the processed audio.)
    static let rendererBundleIDs: Set<String> = ["com.apple.MediaPlayer.RemotePlayerService"]

    private(set) var sampleRate: Double = 48000
    /// Called on the main queue when the output device or tapped processes change and the
    /// capture has to be rebuilt.
    var onInvalidated: (() -> Void)?

    /// One process tap and the layout of its stream in the aggregate's input.
    private struct Capture {
        let tap: AudioObjectID
        let uid: String
        let processes: Set<AudioObjectID>
        let sampleRate: Double
        let channels: Int
        let interleaved: Bool
        /// Where its first buffer is, counted back from the end of the aggregate's input
        /// buffers (the taps' streams follow any input streams of the output device itself).
        var fromEnd = 0
        var bufferCount: Int { interleaved ? 1 : channels }
    }

    private let chain: DSPChain
    private let airPlay: AirPlayStream?
    private let hostPID: pid_t?
    private var renderer: Capture?
    private var host: Capture?
    private var aggregate = AudioObjectID(kAudioObjectUnknown)
    private var ioProc: AudioDeviceIOProcID?
    private var listeners: [AudioObjects.PropertyListener] = []

    private var outputInterleaved = true
    private let hostLeft: UnsafeMutablePointer<Float>
    private let hostRight: UnsafeMutablePointer<Float>
    private let hostPeak = OSAllocatedUnfairLock(initialState: Float(0))
    private let ioQueue = DispatchQueue(label: "com.samsidparty.focalsonic.effects", qos: .userInteractive)

    /// With `airPlay`, plays there rather than on the output device, and also captures `hostPID`.
    init(chain: DSPChain, airPlay: AirPlayStream? = nil, hostPID: pid_t? = nil) throws {
        self.chain = chain
        self.airPlay = airPlay
        self.hostPID = hostPID
        hostLeft = .allocate(capacity: chain.maxFrames)
        hostLeft.initialize(repeating: 0, count: chain.maxFrames)
        hostRight = .allocate(capacity: chain.maxFrames)
        hostRight.initialize(repeating: 0, count: chain.maxFrames)

        do {
            try start()
        } catch {
            destroy()
            throw error
        }
    }

    deinit {
        destroy()
        hostLeft.deallocate()
        hostRight.deallocate()
    }

    private func start() throws {
        // 1. The taps. A process that starts (or restarts) later is picked up by `watchForChanges`.
        let renderer = try Self.makeCapture(
            name: "FocalSonic Effects",
            processes: AudioObjects.ownProcessObjects(bundleIDs: Self.rendererBundleIDs),
            subject: "Apple Music's audio")
        self.renderer = renderer
        sampleRate = renderer.sampleRate

        if airPlay != nil {
            host = try Self.makeCapture(name: "FocalSonic AirPlay", processes: hostProcesses(), subject: "FocalSonic's audio")
        }
        let hostBuffers = host?.bufferCount ?? 0
        self.renderer?.fromEnd = renderer.bufferCount + hostBuffers
        host?.fromEnd = hostBuffers

        // 2. A private aggregate device clocked by the output device, with the taps as input.
        guard let outputDevice = AudioObjects.defaultOutputDevice, let outputUID = AudioObjects.deviceUID(outputDevice) else {
            throw HelperError("There's no audio output device")
        }

        // In this order, which is also the order of their streams in the aggregate's input.
        let taps: [[String: Any]] = [renderer, host].compactMap { $0 }.map {
            [kAudioSubTapUIDKey: $0.uid, kAudioSubTapDriftCompensationKey: true]
        }

        let configuration: [String: Any] = [
            kAudioAggregateDeviceNameKey: "FocalSonic Effects",
            kAudioAggregateDeviceUIDKey: "com.samsidparty.focalsonic.effects.\(UUID().uuidString)",
            kAudioAggregateDeviceIsPrivateKey: true,
            kAudioAggregateDeviceIsStackedKey: false,
            kAudioAggregateDeviceTapAutoStartKey: true,
            kAudioAggregateDeviceMainSubDeviceKey: outputUID,
            kAudioAggregateDeviceSubDeviceListKey: [[kAudioSubDeviceUIDKey: outputUID]],
            kAudioAggregateDeviceTapListKey: taps,
        ]

        var aggregate = AudioObjectID(kAudioObjectUnknown)
        let aggregateStatus = AudioHardwareCreateAggregateDevice(configuration as CFDictionary, &aggregate)
        guard aggregateStatus == noErr, aggregate != AudioObjectID(kAudioObjectUnknown) else {
            throw HelperError("Couldn't set up audio routing for effects (\(aggregateStatus))")
        }
        self.aggregate = aggregate

        guard let outputFormat = AudioObjects.streamFormat(aggregate, scope: kAudioObjectPropertyScopeOutput),
              outputFormat.mFormatFlags & kAudioFormatFlagIsFloat != 0, outputFormat.mBitsPerChannel == 32 else {
            throw HelperError("The output device uses a format the effects engine can't write")
        }
        outputInterleaved = outputFormat.mFormatFlags & kAudioFormatFlagIsNonInterleaved == 0

        // 3. Start processing.
        chain.prepare(sampleRate: sampleRate)
        airPlay?.prepare(sampleRate: sampleRate)

        var procID: AudioDeviceIOProcID?
        let procStatus = AudioDeviceCreateIOProcIDWithBlock(&procID, aggregate, ioQueue) { [unowned self] _, input, _, output, _ in
            self.render(input: input, output: output)
        }
        guard procStatus == noErr, let procID else {
            throw HelperError("Couldn't start effects processing (\(procStatus))")
        }
        ioProc = procID

        let startStatus = AudioDeviceStart(aggregate, procID)
        guard startStatus == noErr else {
            throw HelperError("Couldn't start effects processing (\(startStatus))")
        }

        watchForChanges()
        log("\(airPlay == nil ? "Effects capture" : "AirPlay capture") started at \(Int(sampleRate)) Hz on \(outputUID)")
    }

    private static func makeCapture(name: String, processes: [AudioObjectID], subject: String) throws -> Capture {
        let description = CATapDescription(stereoMixdownOfProcesses: processes)
        description.name = name
        description.isPrivate = true
        description.muteBehavior = .muted

        var tap = AudioObjectID(kAudioObjectUnknown)
        let status = AudioHardwareCreateProcessTap(description, &tap)
        guard status == noErr, tap != AudioObjectID(kAudioObjectUnknown) else {
            throw HelperError("macOS refused to capture \(subject) (\(status)). Allow FocalSonic to record system audio in System Settings > Privacy & Security.")
        }

        guard let format = AudioObjects.value(tap, kAudioTapPropertyFormat, initial: AudioStreamBasicDescription()),
              format.mFormatID == kAudioFormatLinearPCM, format.mFormatFlags & kAudioFormatFlagIsFloat != 0,
              format.mBitsPerChannel == 32 else {
            AudioHardwareDestroyProcessTap(tap)
            throw HelperError("\(subject.prefix(1).uppercased() + subject.dropFirst()) is in a format the effects engine can't process")
        }

        return Capture(tap: tap, uid: description.uuid.uuidString, processes: Set(processes), sampleRate: format.mSampleRate,
                       channels: max(1, Int(format.mChannelsPerFrame)),
                       interleaved: format.mFormatFlags & kAudioFormatFlagIsNonInterleaved == 0)
    }

    /// FocalSonic's own process object, once it has one (it gets it by playing audio).
    private func hostProcesses() -> [AudioObjectID] {
        guard let hostPID, let process = AudioObjects.processObject(pid: hostPID) else { return [] }
        return [process]
    }

    /// Stops processing and releases the taps, which un-mutes the original audio.
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
        for capture in [renderer, host].compactMap({ $0 }) {
            AudioHardwareDestroyProcessTap(capture.tap)
        }
        renderer = nil
        host = nil
    }

    /// The loudest sample of FocalSonic's own audio (AirPlay only) since the last call.
    func takeHostPeak() -> Float {
        hostPeak.withLock { peak in
            defer { peak = 0 }
            return peak
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

        // A process that starts (or restarts) after the taps were made has to be tapped anew.
        let listener = AudioObjects.addListener(AudioObjects.system, kAudioHardwarePropertyProcessObjectList) { [weak self] in
            guard let self else { return }
            let renderers = Set(AudioObjects.ownProcessObjects(bundleIDs: Self.rendererBundleIDs))
            let rendererChanged = !renderers.isSubset(of: self.renderer?.processes ?? [])
            let hostChanged = self.host.map { !Set(self.hostProcesses()).isSubset(of: $0.processes) } ?? false
            if rendererChanged || hostChanged { self.onInvalidated?() }
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

        if airPlay != nil {
            // The music plays on the AirPlay speakers; the Mac's own output stays silent.
            for index in 0..<outputs.count where outputs[index].mData != nil {
                memset(outputs[index].mData, 0, Int(outputs[index].mDataByteSize))
            }
        }

        var offset = 0
        while offset < frames {
            let count = min(frames - offset, chain.maxFrames)
            read(renderer, inputs, offset: offset, count: count, left: chain.left, right: chain.right)
            chain.process(frames: count)

            if let airPlay {
                mixHost(inputs, offset: offset, count: count)
                airPlay.write(left: chain.left, right: chain.right, count: count)
            } else {
                writeOutput(outputs, offset: offset, count: count)
            }
            offset += count
        }

        // Any further output buffers (extra channels or streams) stay silent.
        guard airPlay == nil else { return }
        let used = outputInterleaved ? 1 : min(2, outputs.count)
        for index in used..<outputs.count where outputs[index].mData != nil {
            memset(outputs[index].mData, 0, Int(outputs[index].mDataByteSize))
        }
    }

    private func read(_ capture: Capture?, _ inputs: UnsafeMutableAudioBufferListPointer, offset: Int, count: Int,
                      left: UnsafeMutablePointer<Float>, right: UnsafeMutablePointer<Float>) {
        let start = capture.map { inputs.count - $0.fromEnd } ?? -1

        guard let capture, start >= 0, start < inputs.count,
              let data = inputs[start].mData?.assumingMemoryBound(to: Float.self) else {
            left.update(repeating: 0, count: count)
            right.update(repeating: 0, count: count)
            return
        }

        if capture.interleaved {
            let channels = capture.channels
            let available = Int(inputs[start].mDataByteSize) / (MemoryLayout<Float>.size * channels) - offset
            let usable = max(0, min(count, available))
            for frame in 0..<usable {
                let base = (offset + frame) * channels
                left[frame] = data[base]
                right[frame] = channels > 1 ? data[base + 1] : data[base]
            }
            if usable < count {
                (left + usable).update(repeating: 0, count: count - usable)
                (right + usable).update(repeating: 0, count: count - usable)
            }
        } else {
            let secondIndex = capture.channels > 1 && start + 1 < inputs.count ? start + 1 : start
            let second = inputs[secondIndex].mData?.assumingMemoryBound(to: Float.self) ?? data
            left.update(from: data + offset, count: count)
            right.update(from: second + offset, count: count)
        }
    }

    /// Adds FocalSonic's own audio, untouched, to the processed music.
    private func mixHost(_ inputs: UnsafeMutableAudioBufferListPointer, offset: Int, count: Int) {
        guard host != nil else { return }
        read(host, inputs, offset: offset, count: count, left: hostLeft, right: hostRight)

        let length = vDSP_Length(count)
        var leftPeak: Float = 0
        var rightPeak: Float = 0
        vDSP_maxmgv(hostLeft, 1, &leftPeak, length)
        vDSP_maxmgv(hostRight, 1, &rightPeak, length)
        let peak = max(leftPeak, rightPeak)
        if peak > 0 { _ = hostPeak.withLockIfAvailable { $0 = max($0, peak) } }

        vDSP_vadd(chain.left, 1, hostLeft, 1, chain.left, 1, length)
        vDSP_vadd(chain.right, 1, hostRight, 1, chain.right, 1, length)
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
