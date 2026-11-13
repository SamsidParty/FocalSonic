import Foundation
import MusicKit
import ObjectiveC

// FocalSonic signs in with the developer token Apple's own web player uses, rather than
// one vended for an App ID (which needs a paid developer account with the MusicKit
// capability). Two things make native MusicKit accept it:
//
// 1. A token provider that hands MusicKit that token, so it never asks Apple to vend one.
// 2. An Origin header on MusicKit's API traffic. Web player tokens are origin locked, and
//    without `Origin: https://music.apple.com` every request comes back as an empty 401.

/// Supplies a developer token we already have. The music user token still comes from the
/// account signed into this Mac: `userToken(for:options:)` is public but not open, so it
/// can't be overridden here, but the inherited implementation mints one for our token.
final class FixedDeveloperTokenProvider: MusicUserTokenProvider, MusicDeveloperTokenProvider, @unchecked Sendable {
    private let token: String

    init(token: String) {
        self.token = token
        super.init()
    }

    func developerToken(options: MusicTokenRequestOptions) async throws -> String { token }
}

enum Credentials {
    private(set) static var developerToken: String?

    static func configure(developerToken: String) {
        AppleOriginInjector.install()
        guard developerToken != self.developerToken else { return }
        self.developerToken = developerToken
        MusicDataRequest.tokenProvider = FixedDeveloperTokenProvider(token: developerToken)
    }

    /// The raw music user token for the signed in account, minted for `developerToken`.
    /// The rest of FocalSonic uses it to call the Apple Music API directly.
    static func userToken(ignoreCache: Bool) async throws -> String {
        guard let developerToken else { throw HelperError("Call 'configure' with a developer token first") }
        let options: MusicTokenRequestOptions = ignoreCache ? [.ignoreCache] : []
        return try await MusicUserTokenProvider().userToken(for: developerToken, options: options)
    }
}

/// Re-issues Apple Music API requests with the Origin header web player tokens require.
final class AppleOriginURLProtocol: URLProtocol, @unchecked Sendable {
    private static let handledKey = "FocalSonic.OriginInjected"

    // Our own forwarding session must not route back through this protocol.
    private static let session: URLSession = {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = configuration.protocolClasses?.filter { $0 != AppleOriginURLProtocol.self }
        return URLSession(configuration: configuration)
    }()

    private var forwardingTask: URLSessionDataTask?

    static func isAppleMusicHost(_ host: String?) -> Bool {
        guard let host = host?.lowercased() else { return false }
        return host == "music.apple.com" || host.hasSuffix(".music.apple.com")
    }

    override class func canInit(with request: URLRequest) -> Bool {
        isAppleMusicHost(request.url?.host) && property(forKey: handledKey, in: request) == nil
    }

    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

    override func startLoading() {
        guard let forwarded = (request as NSURLRequest).mutableCopy() as? NSMutableURLRequest else {
            client?.urlProtocol(self, didFailWithError: URLError(.badURL))
            return
        }

        forwarded.setValue("https://music.apple.com", forHTTPHeaderField: "Origin")
        URLProtocol.setProperty(true, forKey: Self.handledKey, in: forwarded)

        forwardingTask = Self.session.dataTask(with: forwarded as URLRequest) { [weak self] data, response, error in
            guard let self else { return }
            if let response { self.client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed) }
            if let data { self.client?.urlProtocol(self, didLoad: data) }
            if let error {
                self.client?.urlProtocol(self, didFailWithError: error)
            } else {
                self.client?.urlProtocolDidFinishLoading(self)
            }
        }
        forwardingTask?.resume()
    }

    override func stopLoading() {
        forwardingTask?.cancel()
    }
}

/// MusicKit builds its own URL sessions, so the protocol is injected into every session
/// configuration it can create by swapping the class factories for wrapped versions.
enum AppleOriginInjector {
    private static var installed = false

    static func install() {
        guard !installed else { return }
        installed = true

        URLProtocol.registerClass(AppleOriginURLProtocol.self)

        let configurationClass: AnyClass = URLSessionConfiguration.self
        let swaps = [
            ("defaultSessionConfiguration", #selector(URLSessionConfiguration.focalSonic_defaultSessionConfiguration)),
            ("ephemeralSessionConfiguration", #selector(URLSessionConfiguration.focalSonic_ephemeralSessionConfiguration)),
        ]

        for (original, replacement) in swaps {
            guard let originalMethod = class_getClassMethod(configurationClass, Selector(original)),
                  let replacementMethod = class_getClassMethod(configurationClass, replacement) else {
                log("Couldn't hook URLSessionConfiguration.\(original); Apple Music requests may be rejected")
                continue
            }
            method_exchangeImplementations(originalMethod, replacementMethod)
        }
    }
}

extension URLSessionConfiguration {
    // After the exchange these names point at Apple's implementations, so the calls
    // below aren't recursive.
    @objc class func focalSonic_defaultSessionConfiguration() -> URLSessionConfiguration {
        withOriginProtocol(focalSonic_defaultSessionConfiguration())
    }

    @objc class func focalSonic_ephemeralSessionConfiguration() -> URLSessionConfiguration {
        withOriginProtocol(focalSonic_ephemeralSessionConfiguration())
    }

    private static func withOriginProtocol(_ configuration: URLSessionConfiguration) -> URLSessionConfiguration {
        var protocols = configuration.protocolClasses ?? []
        if !protocols.contains(where: { $0 == AppleOriginURLProtocol.self }) {
            protocols.insert(AppleOriginURLProtocol.self, at: 0)
        }
        configuration.protocolClasses = protocols
        return configuration
    }
}
