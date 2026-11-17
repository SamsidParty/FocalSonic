import Combine
import Foundation
import MusicKit

/// Plays the host's current track through MusicKit's ApplicationMusicPlayer, one track at a
/// time, the way FocalMK drives the web player on Windows and Linux.
///
/// FocalSonic owns the queue (shuffle, loop and radio all live in the host). MusicKit only ever
/// holds the track that's playing, as the only entry of a fresh queue: when it runs out the
/// host is told ("ended") and loads the next one. MusicKit used to be given the host's next
/// track as well, for gapless changes and so its media controls had somewhere to skip to, but
/// keeping its queue in step meant guessing what MusicKit had done from that queue, and every
/// wrong guess replayed or skipped tracks.
///
/// The system's media controls are FocalSonic's own entry (NowPlayingController, fed by the
/// host like the Windows SMTC integration), with MusicKit's switched off (NowPlayingTakeover).
@MainActor
final class PlaybackController {
    static let shared = PlaybackController()

    private let player = ApplicationMusicPlayer.shared
    private var observers: [AnyCancellable] = []
    private var heartbeat: Timer?

    /// The host playback id of the track MusicKit holds.
    private var currentID: String?
    private var duration: TimeInterval = 0
    private var desiredRate: Float = 1
    private var repeatOne = false
    private var ownNowPlaying = false

    // With nothing queued after it, a track that runs out (or is skipped past) leaves
    // MusicKit paused or stopped and rewound to zero, sometimes in two steps. That
    // transition, when we didn't cause it, is the end of the track.
    private var lastStatus: MusicPlayer.PlaybackStatus = .stopped
    private var lastPlayingTime: TimeInterval = 0
    private var leftPlaying: (at: Date, time: TimeInterval, byHost: Bool)?
    private var lastHostCommand = Date.distantPast
    private var endReported = false
    private var lastVariant = ""

    var isPlaying: Bool { hasTrack && player.state.playbackStatus == .playing }
    var hasTrack: Bool { currentID != nil }

    private init() {}

    func start() {
        guard heartbeat == nil else { return }

        // Both fire before the change lands, so look at the new state on the next turn.
        let onChange: (()) -> Void = { [weak self] _ in
            DispatchQueue.main.async { MainActor.assumeIsolated { self?.tick() } }
        }
        observers = [player.state.objectWillChange.sink(receiveValue: onChange),
                     player.queue.objectWillChange.sink(receiveValue: onChange)]

        let timer = Timer(timeInterval: 0.25, repeats: true) { [weak self] _ in
            MainActor.assumeIsolated { self?.tick() }
        }
        RunLoop.main.add(timer, forMode: .common)
        heartbeat = timer
    }

    // MARK: Commands

    /// Makes `playbackID` the current track: the only one in MusicKit's queue.
    func load(_ playbackID: String, autoplay: Bool) async throws -> [String: Any] {
        hostCommand()

        var replaced = false
        if playbackID == currentID, !isOffTrack {
            // The same track again (a one-song queue repeating, or the track picked again):
            // MusicKit still holds it, so start it over rather than load it afresh.
            if player.playbackTime > 1 { player.playbackTime = 0 }
            restartEndDetection()
        } else {
            try await replaceQueue(with: playbackID)
            replaced = true
        }

        do {
            if autoplay {
                // A new queue only takes over once it's played, even if the old one still is.
                if replaced || player.state.playbackStatus != .playing { try await player.play() }
                applyRate()
            } else {
                try await player.prepareToPlay()
            }
        } catch {
            throw HelperError("Couldn't start playback: \(describeError(error))")
        }

        // Again now that the queue is live: the setting only reaches MusicKit over a connection.
        ownNowPlaying = NowPlayingTakeover.apply()

        // Loading can take a while; what it changed is still ours, not the user's.
        hostCommand()
        tick()
        EffectsController.shared.playbackChanged()
        return ["duration": duration, "id": currentID ?? playbackID, "ownNowPlaying": ownNowPlaying]
    }

    private func replaceQueue(with playbackID: String) async throws {
        let song: Song
        do { song = try await SongResolver.resolve(playbackID) }
        catch { throw HelperError("Couldn't look up \(playbackID): \(describeError(error))") }

        player.queue = ApplicationMusicPlayer.Queue(for: [song])
        player.state.repeatMode = repeatOne ? .one : MusicPlayer.RepeatMode.none
        // Before it plays, so MusicKit's own Now Playing entry doesn't flash up first.
        NowPlayingTakeover.apply()

        currentID = playbackID
        duration = song.duration ?? 0
        restartEndDetection()
    }

    func play() async throws {
        guard let currentID else { return }
        hostCommand()

        // MusicKit went on to an entry of its own (see detectStrayEntry): put the track back.
        if isOffTrack { try await replaceQueue(with: currentID) }

        // Played again after its end was reported, the track starts over and will end anew.
        // Left set, that second end went unreported and playback sat paused at the end.
        restartEndDetection()

        try await player.play()
        hostCommand()
        applyRate()
        tick()
    }

    func pause() {
        hostCommand()
        player.pause()
        tick()
    }

    func stop() {
        hostCommand()
        player.stop()
        currentID = nil
        duration = 0
        tick()
        EffectsController.shared.playbackChanged()
    }

    /// Silences MusicKit on the way out, if this session ever used it.
    func shutdown() {
        guard heartbeat != nil else { return }
        player.stop()
    }

    func seek(to time: TimeInterval) {
        hostCommand()
        let upperBound = duration > 1 ? duration - 0.5 : time
        player.playbackTime = max(0, min(time, upperBound))
        // A seek can land right where the end detector looks.
        lastPlayingTime = player.playbackTime
        tick()
    }

    func setRepeatOne(_ enabled: Bool) {
        repeatOne = enabled
        player.state.repeatMode = enabled ? .one : MusicPlayer.RepeatMode.none
    }

    /// MusicKit time-stretches (pitch is preserved). The effects engine adds the matching
    /// pitch shift when FocalSonic asks for varispeed.
    func setRate(_ rate: Float) {
        desiredRate = rate
        applyRate()
    }

    private func applyRate() {
        // Writing a non-zero rate while paused would start playback.
        guard player.state.playbackStatus == .playing else { return }
        if abs(player.state.playbackRate - desiredRate) > 0.001 {
            lastRateApplied = Date()
            player.state.playbackRate = desiredRate
        }
    }

    private var lastRateApplied = Date.distantPast

    /// What MusicKit actually holds, for diagnosing playback problems.
    func describe() -> [String: Any] {
        [
            "currentID": currentID ?? "",
            "entries": player.queue.entries.map(\.title),
            "currentEntry": player.queue.currentEntry?.title ?? "",
            "ownNowPlaying": ownNowPlaying,
            "status": Self.describe(player.state.playbackStatus),
            "time": player.playbackTime,
        ]
    }

    private func hostCommand() {
        lastHostCommand = Date()
    }

    private func restartEndDetection() {
        endReported = false
        leftPlaying = nil
        lastPlayingTime = 0
    }

    private func reportEnd() {
        guard !endReported, let currentID else { return }
        endReported = true
        IPC.event("ended", ["id": currentID])
    }

    // MARK: State reporting

    private func tick() {
        guard currentID != nil else { return emitState() }

        detectStrayEntry()
        detectOutsideControl()

        // MusicKit drops back to 1x by itself at times (a new item does), and only the moments
        // we set the rate re-applied it, so a track could carry on at 1x while the UI showed
        // another speed (and the effects engine kept its pitch shift). Throttled, in case some
        // item refuses the rate.
        if Date().timeIntervalSince(lastRateApplied) > 1 { applyRate() }

        emitState()
    }

    private func emitState() {
        let status = player.state.playbackStatus
        let time = player.playbackTime

        if status == .playing { lastPlayingTime = time }
        lastStatus = status

        let variant = Self.describe(player.state.audioVariant)
        if variant != lastVariant {
            lastVariant = variant
            IPC.event("variant", ["id": currentID ?? "", "variant": variant])
        }

        IPC.event("state", [
            "status": Self.describe(status),
            "time": time,
            "duration": duration,
            "id": currentID ?? "",
        ])
    }

    /// The current track is always MusicKit's first and only entry. With more than one, MusicKit
    /// added some itself (playing on once the queue ended, say), and being on one of those is
    /// being on a track FocalSonic doesn't know.
    private var isOffTrack: Bool {
        let entries = player.queue.entries
        guard entries.count > 1, let current = player.queue.currentEntry else { return false }
        return entries.first?.id != current.id
    }

    private func detectStrayEntry() {
        guard isOffTrack, Date().timeIntervalSince(lastHostCommand) >= 1.5 else { return }

        // Stop there and let the host move on from the end of its track.
        if player.state.playbackStatus == .playing {
            hostCommand() // This pause isn't the user's.
            player.pause()
        }
        reportEnd()
    }

    private func detectOutsideControl() {
        let status = player.state.playbackStatus
        let time = player.playbackTime
        let byHost = Date().timeIntervalSince(lastHostCommand) < 1.5

        if lastStatus == .playing, status != .playing {
            leftPlaying = (Date(), lastPlayingTime, byHost)
        } else if status == .playing {
            leftPlaying = nil
        }

        // The end of the track: soon after leaving playing, it rewound or had reached the end.
        if !endReported, status == .paused || status == .stopped,
           let left = leftPlaying, !left.byHost, Date().timeIntervalSince(left.at) < 3 {
            let slack = max(3.0, Double(desiredRate) * 1.5)
            let reachedEnd = duration > 0 && left.time >= duration - slack
            // Previews (no subscription) stop well before the catalog duration, but still rewind.
            let rewound = time < 1 && left.time > 2

            if reachedEnd || rewound {
                reportEnd()
                return
            }
        }

        // Play/pause from outside FocalSonic: MusicKit's own media controls when it keeps its
        // Now Playing entry, and MusicKit pausing itself (headphones unplugged, say).
        guard !byHost, status != lastStatus else { return }
        if lastStatus == .playing, status == .paused, time >= 1 {
            IPC.event("remote", ["command": "pause"])
        } else if lastStatus == .paused, status == .playing {
            IPC.event("remote", ["command": "play"])
        }
    }

    private static func describe(_ status: MusicPlayer.PlaybackStatus) -> String {
        switch status {
        case .playing: return "playing"
        case .paused: return "paused"
        case .stopped: return "stopped"
        case .interrupted: return "interrupted"
        case .seekingForward: return "seekingForward"
        case .seekingBackward: return "seekingBackward"
        @unknown default: return "unknown"
        }
    }

    private static func describe(_ variant: AudioVariant?) -> String {
        guard let variant else { return "" }
        switch variant {
        case .dolbyAtmos, .spatialAudio: return "atmos"
        case .dolbyAudio: return "dolby"
        case .lossless, .highResolutionLossless: return "lossless"
        case .lossyStereo: return "stereo"
        @unknown default: return ""
        }
    }
}

/// Turns FocalSonic's playback ids into MusicKit songs. Accepted forms are "<catalogId>",
/// "<catalogId>/<libraryId>" and a bare library id such as "i.AbC123".
enum SongResolver {
    static func resolve(_ playbackID: String) async throws -> Song {
        let parts = playbackID.split(separator: "/").map(String.init)
        let libraryID = parts.last.flatMap { isCatalogID($0) ? nil : $0 }

        if let catalogID = parts.first, isCatalogID(catalogID) {
            // A single id is fetched as /catalog/{storefront}/songs/{id}, which answers 404 for
            // songs your storefront doesn't carry (e.g. a Japanese single in India), even when
            // they're in your library. So a failure here only means "try the library".
            do {
                let request = MusicCatalogResourceRequest<Song>(matching: \.id, equalTo: MusicItemID(catalogID))
                if let song = try await request.response().items.first { return song }
            } catch {
                guard libraryID != nil else { throw error }
            }
        }

        // Library only tracks (uploads, or ones that left or aren't in your storefront's
        // catalog). MusicKit decodes Apple Music API resources directly, so fetch the library
        // resource and play that.
        if let libraryID,
           let escaped = libraryID.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed),
           let url = URL(string: "https://api.music.apple.com/v1/me/library/songs/\(escaped)") {
            do {
                let response = try await MusicDataRequest(urlRequest: URLRequest(url: url)).response()
                let songs = try JSONDecoder().decode(MusicItemCollection<Song>.self, from: response.data)
                if let song = songs.first { return song }
            } catch let error as MusicDataRequest.Error where error.status == 404 {
                // Not in the library (any more) either.
            }
        }

        throw HelperError("This song isn't available in your Apple Music storefront")
    }

    private static func isCatalogID(_ value: String) -> Bool {
        !value.isEmpty && value.allSatisfy(\.isASCII) && value.allSatisfy(\.isNumber)
    }
}
