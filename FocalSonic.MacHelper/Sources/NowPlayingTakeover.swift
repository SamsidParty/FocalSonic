import Foundation
import MusicKit
import ObjectiveC

/// Keeps MusicKit's own Now Playing entry out of the system, so the one FocalSonic publishes
/// (NowPlayingController, fed by the host like the Windows SMTC integration) is what Control
/// Center, the media keys and AirPods show and control.
///
/// MusicKit plays in MediaPlayer's per-client RemotePlayerService, which makes itself the Now
/// Playing app. The MPMusicPlayerApplicationController behind ApplicationMusicPlayer has a
/// private switch for that, `disableAutomaticCanBeNowPlaying`, which it passes on to the
/// service. Being private it's looked up at runtime; when it can't be found MusicKit keeps its
/// entry, and the host doesn't publish a second one (`load` replies with "ownNowPlaying").
///
/// Set FOCALSONIC_MUSICKIT_NOW_PLAYING=1 to leave MusicKit's entry in charge.
@MainActor
enum NowPlayingTakeover {
    private static let enabled = ProcessInfo.processInfo.environment["FOCALSONIC_MUSICKIT_NOW_PLAYING"] != "1"
    private static let wrapperClass = "MusicKit_SoftLinking_MPMusicPlayerController"
    private static let setter = NSSelectorFromString("setDisableAutomaticCanBeNowPlaying:")

    private static var lookedUp = false
    private static var controller: NSObject?

    /// Switches MusicKit's entry off; returns whether it is. The setting only reaches the service
    /// over a live connection, which MediaPlayer can reopen, so this is repeated on every load.
    @discardableResult
    static func apply() -> Bool {
        guard enabled, let controller = musicKitController() else { return false }
        controller.setValue(true, forKey: "disableAutomaticCanBeNowPlaying")
        return true
    }

    /// The controller ApplicationMusicPlayer drives. Not MPMusicPlayerController's
    /// applicationQueuePlayer: that's a separate instance with its own connection.
    private static func musicKitController() -> NSObject? {
        if lookedUp { return controller }
        lookedUp = true

        guard let wrapper = find(in: ApplicationMusicPlayer.shared, depth: 0),
              class_getInstanceVariable(type(of: wrapper), "_underlyingPlayerController") != nil,
              let inner = wrapper.value(forKey: "underlyingPlayerController") as? NSObject,
              inner.responds(to: setter) else {
            log("Can't switch off MusicKit's Now Playing entry; it keeps the media controls")
            return nil
        }

        controller = inner
        return inner
    }

    /// MusicKit's soft-linking wrapper sits in the player's private stored properties.
    private static func find(in value: Any, depth: Int) -> NSObject? {
        var mirror: Mirror? = Mirror(reflecting: value)
        while let current = mirror {
            for child in current.children {
                if let object = child.value as? NSObject, NSStringFromClass(type(of: object)) == wrapperClass {
                    return object
                }
                if depth < 3, let found = find(in: child.value, depth: depth + 1) { return found }
            }
            mirror = current.superclassMirror
        }
        return nil
    }
}
