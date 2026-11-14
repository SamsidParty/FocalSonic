import AppKit
import Foundation
import MediaPlayer

/// Publishes FocalSonic's current track to the system (Control Center, the lock screen,
/// AirPods / keyboard media keys) and forwards the controls back to the host, which owns
/// the queue. This is the macOS counterpart of the Windows SMTC integration.
@MainActor
final class NowPlayingController {
    static let shared = NowPlayingController()

    private let center = MPNowPlayingInfoCenter.default()
    private let commands = MPRemoteCommandCenter.shared()
    private var registered = false

    private var artworkURL: String?
    private var artwork: MPMediaItemArtwork?
    private var artworkTask: Task<Void, Never>?
    private var lastInfo: [String: Any] = [:]

    /// Whether the host says music from another server is playing (Apple Music reports its own).
    private(set) var isPlaying = false

    private init() {}

    func update(_ command: Command) {
        registerCommands()

        guard command.bool("active") ?? true else {
            clear()
            return
        }

        let playing = command.bool("playing") ?? false
        isPlaying = playing
        var info: [String: Any] = [
            MPMediaItemPropertyTitle: command.string("title") ?? "",
            MPMediaItemPropertyArtist: command.string("artist") ?? "",
            MPMediaItemPropertyAlbumTitle: command.string("album") ?? "",
            MPMediaItemPropertyPlaybackDuration: command.number("duration") ?? 0,
            MPNowPlayingInfoPropertyElapsedPlaybackTime: command.number("position") ?? 0,
            MPNowPlayingInfoPropertyPlaybackRate: playing ? (command.number("rate") ?? 1) : 0,
            MPNowPlayingInfoPropertyDefaultPlaybackRate: 1.0,
            MPNowPlayingInfoPropertyMediaType: MPNowPlayingInfoMediaType.audio.rawValue,
        ]

        updateArtwork(command.string("artwork"))
        if let artwork { info[MPMediaItemPropertyArtwork] = artwork }

        lastInfo = info
        center.nowPlayingInfo = info
        center.playbackState = playing ? .playing : .paused

        commands.nextTrackCommand.isEnabled = command.bool("canNext") ?? true
        commands.previousTrackCommand.isEnabled = command.bool("canPrevious") ?? true
        commands.changePlaybackPositionCommand.isEnabled = (command.number("duration") ?? 0) > 0
    }

    func clear() {
        isPlaying = false
        artworkTask?.cancel()
        artworkURL = nil
        artwork = nil
        lastInfo = [:]
        center.nowPlayingInfo = nil
        center.playbackState = .stopped
    }

    private func registerCommands() {
        guard !registered else { return }
        registered = true

        func forward(_ command: MPRemoteCommand, as name: String) {
            command.isEnabled = true
            command.addTarget { _ in
                IPC.event("remote", ["command": name])
                return .success
            }
        }

        forward(commands.playCommand, as: "play")
        forward(commands.pauseCommand, as: "pause")
        forward(commands.togglePlayPauseCommand, as: "toggle")
        forward(commands.nextTrackCommand, as: "next")
        forward(commands.previousTrackCommand, as: "previous")

        commands.changePlaybackPositionCommand.addTarget { event in
            guard let event = event as? MPChangePlaybackPositionCommandEvent else { return .commandFailed }
            IPC.event("remote", ["command": "seek", "time": event.positionTime])
            return .success
        }

        // FocalSonic has no notion of these, so keep them out of the system UI.
        for unsupported in [commands.skipForwardCommand, commands.skipBackwardCommand,
                            commands.seekForwardCommand, commands.seekBackwardCommand,
                            commands.changeRepeatModeCommand, commands.changeShuffleModeCommand,
                            commands.likeCommand, commands.dislikeCommand, commands.bookmarkCommand] {
            unsupported.isEnabled = false
        }
    }

    private func updateArtwork(_ url: String?) {
        guard url != artworkURL else { return }
        artworkURL = url
        artwork = nil
        artworkTask?.cancel()

        guard let url, let source = URL(string: url) else { return }

        artworkTask = Task { [weak self] in
            guard let (data, _) = try? await URLSession.shared.data(from: source),
                  !Task.isCancelled,
                  let image = NSImage(data: data) else { return }

            await MainActor.run {
                guard let self, self.artworkURL == url else { return }
                let artwork = MPMediaItemArtwork(boundsSize: image.size) { _ in image }
                self.artwork = artwork
                guard !self.lastInfo.isEmpty else { return }
                self.lastInfo[MPMediaItemPropertyArtwork] = artwork
                self.center.nowPlayingInfo = self.lastInfo
            }
        }
    }
}
