import Combine
import Foundation
import MusicKit

/// Plays FocalSonic's queue through MusicKit's ApplicationMusicPlayer.
///
/// FocalSonic owns the queue (shuffle, loop and radio all live in the host), but MusicKit is
/// what the system's media controls talk to: its renderer publishes the Now Playing entry
/// and receives media keys, Control Center and AirPods commands itself. So MusicKit is also
/// given the host's next track, and every move it makes on its own (a track ending, a skip
/// or back from the keyboard) is reported to the host, which follows it and supplies the
/// next track again. Natural track changes come out gapless as a bonus.
///
/// On macOS MusicKit can't start a queue part way through ("unexpected start item") and
/// breaks if its entries are replaced, so the next track is only ever inserted after the
/// current one. The newest insert always comes first, so a superseded one is never reached.
@MainActor
final class PlaybackController {
    static let shared = PlaybackController()

    private let player = ApplicationMusicPlayer.shared
    private var observers: [AnyCancellable] = []
    private var heartbeat: Timer?

    // What MusicKit holds, as host playback ids.
    private var currentID: String?
    private var nextID: String?
    /// Which host id each queued song stands for (an id can be "<catalog>/<library>").
    private var playbackIDs: [MusicItemID: String] = [:]
    private var currentEntryID: String?

    private var duration: TimeInterval = 0
    private var desiredRate: Float = 1
    private var repeatOne = false

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

    /// Makes `playbackID` the current track, followed by `next` from the host's queue.
    func load(_ playbackID: String, next: String?, autoplay: Bool) async throws -> [String: Any] {
        hostCommand()

        var replaced = false
        if playbackID == currentID {
            // MusicKit already moved here by itself (a track ended or a media key skipped), or
            // it's the same track again (repeating a one-song queue). Either way its end has
            // to be reported afresh, and not from the transition that's already been reported.
            endReported = false
            leftPlaying = nil
        } else if playbackID == nextID, hasQueuedNext {
            // Stepping onto the queued track is a skip, which keeps the change seamless.
            do { try await player.skipToNextEntry() }
            catch { throw HelperError("Couldn't skip to the queued track: \(describeError(error))") }
            adoptCurrentEntry()
        } else {
            try await replaceQueue(current: playbackID, next: next)
            replaced = true
        }

        // Best effort: the track is loaded either way, and without a queued next track the
        // host just loads it when this one ends. Failing the whole load here reported an
        // error over a track that was playing fine.
        do { try await setNext(next) }
        catch { log("Couldn't queue \(next ?? "-") after \(playbackID): \(describeError(error))") }

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

        // Loading can take a while; what it changed is still ours, not the user's.
        hostCommand()
        tick()
        EffectsController.shared.playbackChanged()
        return ["duration": duration, "id": currentID ?? playbackID]
    }

    /// Queues the host's next track straight after the current one, without interrupting it.
    func setNext(_ next: String?) async throws {
        guard next != nextID else { return }
        nextID = nil

        guard let next, let current = player.queue.currentEntry, let song = await SongResolver.neighbour(next) else { return }

        let entries = Array(player.queue.entries)
        if let currentIndex = entries.firstIndex(where: { $0.id == current.id }) {
            // Already right after this one: MusicKit stepped back onto an earlier entry, and the
            // track it came from is the next one again.
            if currentIndex + 1 < entries.count, Self.songID(of: entries[currentIndex + 1]) == song.id {
                playbackIDs[song.id] = next
                nextID = next
                return
            }

            // A second entry for a song this queue has already played (the first track again
            // when repeating the queue, or a playlist listing a song twice) is where loading
            // broke. Leave the gap: when this track ends the host loads that song afresh.
            if entries[...currentIndex].contains(where: { Self.songID(of: $0) == song.id }) {
                log("Not queueing \(next): it already has an earlier entry in MusicKit's queue")
                return
            }
        }

        try await player.queue.insert(song, position: .afterCurrentEntry)
        playbackIDs[song.id] = next
        nextID = next
    }

    private static func songID(of entry: ApplicationMusicPlayer.Queue.Entry) -> MusicItemID? {
        guard case .song(let song)? = entry.item else { return nil }
        return song.id
    }

    private var hasQueuedNext: Bool {
        guard let current = player.queue.currentEntry else { return false }
        return player.queue.entries.last?.id != current.id
    }

    private func replaceQueue(current playbackID: String, next: String?) async throws {
        async let nextSong = SongResolver.neighbour(next)
        let song: Song
        do { song = try await SongResolver.resolve(playbackID) }
        catch { throw HelperError("Couldn't look up \(playbackID): \(describeError(error))") }
        let after = await nextSong

        playbackIDs = [song.id: playbackID]
        if let after, let next { playbackIDs[after.id] = next }

        // Built whole rather than inserted later, since a fresh queue has no current entry yet.
        player.queue = ApplicationMusicPlayer.Queue(for: [song] + (after.map { [$0] } ?? []))
        player.state.repeatMode = repeatOne ? .one : MusicPlayer.RepeatMode.none

        nextID = after == nil ? nil : next
        setCurrent(playbackID, duration: song.duration, entryID: nil)
    }

    func play() async throws {
        guard currentID != nil else { return }
        hostCommand()
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
        nextID = nil
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

    /// What MusicKit actually holds, for diagnosing queue problems.
    func describe() -> [String: Any] {
        [
            "currentID": currentID ?? "",
            "nextID": nextID ?? "",
            "entries": player.queue.entries.map(\.title),
            "currentEntry": player.queue.currentEntry?.title ?? "",
            "status": Self.describe(player.state.playbackStatus),
            "time": player.playbackTime,
        ]
    }

    private func hostCommand() {
        lastHostCommand = Date()
    }

    private func setCurrent(_ playbackID: String, duration: TimeInterval?, entryID: String?) {
        currentID = playbackID
        currentEntryID = entryID ?? player.queue.currentEntry?.id
        self.duration = duration ?? 0
        endReported = false
        lastPlayingTime = 0
        leftPlaying = nil
    }

    // MARK: State reporting

    private func tick() {
        guard currentID != nil else { return emitState() }

        detectQueueMove()
        detectOutsideControl()

        // MusicKit drops back to 1x by itself at times (a new item does, see adoptCurrentEntry),
        // and only the moments we set the rate re-applied it, so a track could carry on at 1x
        // while the UI showed another speed (and the effects engine kept its pitch shift).
        // Throttled, in case some item refuses the rate.
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

    /// MusicKit stepped to another entry of the window on its own: the track ended, or a
    /// media key / Control Center skipped. Tell the host so it moves its queue the same way.
    private func detectQueueMove() {
        guard let entry = player.queue.currentEntry, entry.id != currentEntryID else { return }
        adoptCurrentEntry()
    }

    private func adoptCurrentEntry() {
        guard let entry = player.queue.currentEntry, entry.id != currentEntryID else { return }

        // MusicKit only creates the entry for a fresh queue's first track once it's prepared.
        guard case .song(let song)? = entry.item, let playbackID = playbackIDs[song.id], playbackID != currentID else {
            currentEntryID = entry.id
            return
        }

        let entries = player.queue.entries
        let newIndex = entries.firstIndex { $0.id == entry.id } ?? 0
        let oldIndex = entries.firstIndex { $0.id == currentEntryID } ?? newIndex
        let forward = newIndex > oldIndex
        let expected = !forward || playbackID == nextID
        let byHost = Date().timeIntervalSince(lastHostCommand) < 1.5
        let previous = currentID

        nextID = nil
        setCurrent(playbackID, duration: song.duration, entryID: entry.id)
        applyRate() // A new item can come up at normal speed.
        guard !byHost else { return }

        if expected {
            IPC.event("advanced", ["id": playbackID, "direction": forward ? "next" : "previous", "duration": duration])
        } else {
            // A track the host has since dropped (it had nothing to follow with): stop
            // there and let the host treat it as the end of the previous track.
            player.pause()
            IPC.event("ended", ["id": previous ?? ""])
        }
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
                endReported = true
                IPC.event("ended", ["id": currentID ?? ""])
                return
            }
        }

        // Play/pause from outside FocalSonic (media keys, Control Center, AirPods).
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

        if let catalogID = parts.first, isCatalogID(catalogID) {
            let request = MusicCatalogResourceRequest<Song>(matching: \.id, equalTo: MusicItemID(catalogID))
            if let song = try await request.response().items.first { return song }
        }

        // Library only tracks (uploads, or ones that left the catalog). MusicKit decodes
        // Apple Music API resources directly, so fetch the library resource and play that.
        if let libraryID = parts.last, !isCatalogID(libraryID),
           let escaped = libraryID.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed),
           let url = URL(string: "https://api.music.apple.com/v1/me/library/songs/\(escaped)") {
            let response = try await MusicDataRequest(urlRequest: URLRequest(url: url)).response()
            let songs = try JSONDecoder().decode(MusicItemCollection<Song>.self, from: response.data)
            if let song = songs.first { return song }
        }

        throw HelperError("This song isn't available in your Apple Music storefront")
    }

    /// A neighbour that can't be found just leaves a gap in MusicKit's window.
    static func neighbour(_ playbackID: String?) async -> Song? {
        guard let playbackID else { return nil }
        return try? await resolve(playbackID)
    }

    private static func isCatalogID(_ value: String) -> Bool {
        !value.isEmpty && value.allSatisfy(\.isASCII) && value.allSatisfy(\.isNumber)
    }
}
