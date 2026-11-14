import AVFoundation
import Foundation

/// An AirPlay route of FocalSonic's own: AVFoundation's AVOutputContext, the object Music uses
/// to send just its own audio to AirPlay speakers while everything else stays on the Mac.
///
/// macOS has no public API for this. Programmatic AirPlay discovery is filtered out for apps
/// other than Apple's, so speakers are only ever chosen by the user, in Apple's own AirPlay
/// picker (the host shows an AVRoutePickerView pointed at this context's ID). The class and the
/// few members used here are looked up at runtime: if a future macOS changes them, AirPlay is
/// just unavailable.
final class OutputContext {
    let object: NSObject
    let id: String

    private var spi: OutputContextSPI { unsafeBitCast(object, to: OutputContextSPI.self) }

    /// A new, app-owned music context (not the system's, and not shared with MusicKit's
    /// renderer, which would follow the app's default one). It supports multiple speakers.
    static func make() -> OutputContext? {
        guard let contextClass = NSClassFromString("AVOutputContext") as? NSObject.Type else { return nil }
        let factory = NSSelectorFromString("iTunesAudioContext")
        guard contextClass.responds(to: factory),
              let object = contextClass.perform(factory)?.takeUnretainedValue() as? NSObject else { return nil }

        let required = ["contextID", "outputDevices", "setOutputDevice:options:completionHandler:"]
        guard required.allSatisfy({ object.responds(to: NSSelectorFromString($0)) }) else { return nil }

        let context = OutputContext(object: object)
        return context.id.isEmpty ? nil : context
    }

    private init(object: NSObject) {
        self.object = object
        self.id = unsafeBitCast(object, to: OutputContextSPI.self).contextID ?? ""
    }

    /// The speakers the user picked, by name. Empty while the route is this Mac.
    var speakers: [String] {
        let local = Self.localDeviceID
        return spi.outputDevices.compactMap { device in
            let device = unsafeBitCast(device, to: OutputDeviceSPI.self)
            guard local == nil || device.identifier != local else { return nil }
            return device.name ?? "AirPlay"
        }
    }

    /// Hands the speakers back, so the route plays on this Mac again.
    func disconnect() {
        spi.setOutputDevice(Self.localDevice, options: nil) { _ in }
    }

    /// Plays `renderer` through this route instead of the Mac's output device.
    func attach(_ renderer: AVSampleBufferAudioRenderer) -> Bool {
        let setter = NSSelectorFromString("setOutputContext:")
        guard renderer.responds(to: setter) else { return false }
        renderer.perform(setter, with: object)
        return true
    }

    /// The route changing (devices picked or dropped, from the picker or another app taking a
    /// speaker over) is posted as notifications on the context.
    func observe(_ handler: @escaping () -> Void) -> NSObjectProtocol {
        NotificationCenter.default.addObserver(forName: nil, object: object, queue: .main) { _ in handler() }
    }

    private static var localDevice: NSObject? {
        guard let deviceClass = NSClassFromString("AVOutputDevice") as? NSObject.Type else { return nil }
        let factory = NSSelectorFromString("sharedLocalDevice")
        guard deviceClass.responds(to: factory) else { return nil }
        return deviceClass.perform(factory)?.takeUnretainedValue() as? NSObject
    }

    private static var localDeviceID: String? {
        localDevice.flatMap { unsafeBitCast($0, to: OutputDeviceSPI.self).identifier }
    }
}

// The members of AVOutputContext and AVOutputDevice used above. An Objective-C protocol is just
// the object pointer, so the private classes can be viewed through these without conforming.

@objc private protocol OutputContextSPI {
    var contextID: String? { get }
    var outputDevices: [NSObject] { get }
    // The handler's argument isn't touched (nor retained), whatever the private type is.
    func setOutputDevice(_ device: NSObject?, options: [String: Any]?, completionHandler: @escaping @convention(block) (OpaquePointer?) -> Void)
}

@objc private protocol OutputDeviceSPI {
    var name: String? { get }
    @objc(ID) var identifier: String? { get }
}
