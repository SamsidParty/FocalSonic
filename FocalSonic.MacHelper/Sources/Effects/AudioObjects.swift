import CoreAudio
import Foundation

/// Small typed wrappers over the AudioObject property API.
enum AudioObjects {
    static let system = AudioObjectID(kAudioObjectSystemObject)

    static func address(_ selector: AudioObjectPropertySelector,
                        _ scope: AudioObjectPropertyScope = kAudioObjectPropertyScopeGlobal) -> AudioObjectPropertyAddress {
        AudioObjectPropertyAddress(mSelector: selector, mScope: scope, mElement: kAudioObjectPropertyElementMain)
    }

    static func value<T>(_ object: AudioObjectID, _ selector: AudioObjectPropertySelector,
                         scope: AudioObjectPropertyScope = kAudioObjectPropertyScopeGlobal, initial: T) -> T? {
        var address = address(selector, scope)
        var size = UInt32(MemoryLayout<T>.size)
        var value = initial
        let status = withUnsafeMutablePointer(to: &value) { AudioObjectGetPropertyData(object, &address, 0, nil, &size, $0) }
        return status == noErr ? value : nil
    }

    static func string(_ object: AudioObjectID, _ selector: AudioObjectPropertySelector) -> String? {
        var address = address(selector)
        var size = UInt32(MemoryLayout<CFString?>.size)
        var value: Unmanaged<CFString>?
        let status = AudioObjectGetPropertyData(object, &address, 0, nil, &size, &value)
        guard status == noErr, let value else { return nil }
        return value.takeRetainedValue() as String
    }

    static func objectList(_ object: AudioObjectID, _ selector: AudioObjectPropertySelector,
                           scope: AudioObjectPropertyScope = kAudioObjectPropertyScopeGlobal) -> [AudioObjectID] {
        var address = address(selector, scope)
        var size: UInt32 = 0
        guard AudioObjectGetPropertyDataSize(object, &address, 0, nil, &size) == noErr, size > 0 else { return [] }

        var list = [AudioObjectID](repeating: 0, count: Int(size) / MemoryLayout<AudioObjectID>.size)
        let status = list.withUnsafeMutableBytes { buffer in
            AudioObjectGetPropertyData(object, &address, 0, nil, &size, buffer.baseAddress!)
        }
        return status == noErr ? list : []
    }

    static var defaultOutputDevice: AudioObjectID? {
        let device = value(system, kAudioHardwarePropertyDefaultOutputDevice, initial: AudioObjectID(kAudioObjectUnknown))
        return device == AudioObjectID(kAudioObjectUnknown) ? nil : device
    }

    static func deviceUID(_ device: AudioObjectID) -> String? {
        string(device, kAudioDevicePropertyDeviceUID)
    }

    /// The stream format of the first stream in `scope` of a device.
    static func streamFormat(_ device: AudioObjectID, scope: AudioObjectPropertyScope) -> AudioStreamBasicDescription? {
        guard let stream = objectList(device, kAudioDevicePropertyStreams, scope: scope).first else { return nil }
        return value(stream, kAudioStreamPropertyVirtualFormat, initial: AudioStreamBasicDescription())
    }

    /// Core Audio process objects with one of `bundleIDs` that work on behalf of the same app
    /// as this process. XPC services such as MusicKit's renderer run once per client, and
    /// this keeps another app's instance out of our tap.
    static func ownProcessObjects(bundleIDs: Set<String>) -> [AudioObjectID] {
        let ownResponsible = Responsibility.responsiblePID(for: getpid())
        return objectList(system, kAudioHardwarePropertyProcessObjectList).filter { process in
            guard let bundleID = string(process, kAudioProcessPropertyBundleID), bundleIDs.contains(bundleID) else { return false }
            guard let ownResponsible, let pid = value(process, kAudioProcessPropertyPID, initial: pid_t(-1)), pid > 0 else { return true }
            return Responsibility.responsiblePID(for: pid) == ownResponsible
        }
    }

    /// The Core Audio process object for `pid`, if it has one.
    static func processObject(pid: pid_t) -> AudioObjectID? {
        var address = address(kAudioHardwarePropertyTranslatePIDToProcessObject)
        var pid = pid
        var process = AudioObjectID(kAudioObjectUnknown)
        var size = UInt32(MemoryLayout<AudioObjectID>.size)
        let status = AudioObjectGetPropertyData(system, &address, UInt32(MemoryLayout<pid_t>.size), &pid, &size, &process)
        return status == noErr && process != AudioObjectID(kAudioObjectUnknown) ? process : nil
    }

    /// Runs `handler` on the main queue whenever the property changes. Keep the returned
    /// token and pass it to `removeListener` to stop.
    static func addListener(_ object: AudioObjectID, _ selector: AudioObjectPropertySelector,
                            handler: @escaping () -> Void) -> PropertyListener? {
        var address = address(selector)
        let block: AudioObjectPropertyListenerBlock = { _, _ in handler() }
        guard AudioObjectAddPropertyListenerBlock(object, &address, DispatchQueue.main, block) == noErr else { return nil }
        return PropertyListener(object: object, address: address, block: block)
    }

    /// The process macOS attributes another process's work to (the app, for its helpers and
    /// XPC services). The lookup lives in libsystem but isn't in the SDK headers, so it's
    /// resolved at runtime; without it every matching process counts as ours.
    enum Responsibility {
        private typealias Lookup = @convention(c) (pid_t) -> pid_t

        private static let lookup: Lookup? = {
            guard let symbol = dlsym(dlopen(nil, RTLD_NOW), "responsibility_get_pid_responsible_for_pid") else { return nil }
            return unsafeBitCast(symbol, to: Lookup.self)
        }()

        static func responsiblePID(for pid: pid_t) -> pid_t? {
            guard let lookup else { return nil }
            let responsible = lookup(pid)
            return responsible > 0 ? responsible : nil
        }
    }

    struct PropertyListener {
        let object: AudioObjectID
        let address: AudioObjectPropertyAddress
        let block: AudioObjectPropertyListenerBlock

        func remove() {
            var address = address
            AudioObjectRemovePropertyListenerBlock(object, &address, DispatchQueue.main, block)
        }
    }
}
