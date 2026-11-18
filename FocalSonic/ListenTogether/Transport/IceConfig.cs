using FocalSonic.ListenTogether.Core;
using Newtonsoft.Json.Linq;
using SIPSorcery.Net;

namespace FocalSonic.ListenTogether.Transport
{
    /// <summary>
    /// Which servers a connection attempt uses. ICE always prefers a direct path (host and
    /// server reflexive candidates) and only falls back to the relay, but SIPSorcery takes a
    /// single TURN server per connection, so networks that block more need a second attempt
    /// that reaches the relay over TLS on 443.
    ///
    /// The relay is reached over TCP even in the first profile: SIPSorcery resends Allocate
    /// requests every 50 ms, and over UDP a server can answer a resend ("437 allocation
    /// mismatch") before the original, which SIPSorcery counts as failure and gives up after
    /// three. Over TCP the answers arrive in order. (Seen as ~25% of relay allocations failing
    /// against Cloudflare over UDP, none over TCP.) Peer traffic through the relay is tiny, so
    /// TCP's overhead doesn't matter; direct connections still use UDP.
    /// </summary>
    public enum IceProfile
    {
        /// <summary>STUN on UDP 3478, TURN over TCP 3478. Works on most networks.</summary>
        Udp = 0,
        /// <summary>STUN 443 and TURN over TLS on 443, which looks like HTTPS to firewalls.</summary>
        Tls = 1,
    }

    public static class IceConfig
    {
        public static string CredentialUrl =>
            Environment.GetEnvironmentVariable("FOCALSONIC_LT_TURN_URL") ?? "https://www.samsidparty.com/Services/focalsonic/turn.php";

        static JArray? cachedServers;
        static DateTime cachedUntil = DateTime.MinValue;
        static readonly SemaphoreSlim FetchGate = new(1, 1);

        /// <summary>Test hook: never offer the relay (peers on one machine always connect directly).</summary>
        public static bool ForceRelay => Environment.GetEnvironmentVariable("FOCALSONIC_LT_FORCE_RELAY") == "1";

        static async Task<JArray?> FetchServers(CancellationToken ct)
        {
            await FetchGate.WaitAsync(ct);
            try
            {
                if (cachedServers != null && DateTime.UtcNow < cachedUntil) return cachedServers;

                for (int attempt = 0; attempt < 3; attempt++)
                {
                    try
                    {
                        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
                        timeout.CancelAfter(TimeSpan.FromSeconds(8));
                        var text = await LtHttp.Client.GetStringAsync(CredentialUrl, timeout.Token);
                        var json = JObject.Parse(text);
                        var servers = json["iceServers"] as JArray;
                        if (servers == null) throw new Exception("no iceServers in the response");

                        var ttl = json.Value<double?>("ttl") ?? 3600;
                        cachedServers = servers;
                        // Renew well before expiry: an allocation outlives the credential, but a
                        // reconnect late in a long session needs a fresh one.
                        cachedUntil = DateTime.UtcNow.AddSeconds(Math.Clamp(ttl / 2, 60, 6 * 3600));
                        return servers;
                    }
                    catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
                    catch (Exception ex)
                    {
                        LtLog.Warn($"Couldn't fetch relay credentials (attempt {attempt + 1}): {ex.Message}");
                        await Task.Delay(500 * (attempt + 1), ct);
                    }
                }

                // Direct connections still work without the relay; a stale credential might too.
                return cachedServers;
            }
            finally
            {
                FetchGate.Release();
            }
        }

        public static async Task<RTCConfiguration> Build(IceProfile profile, CancellationToken ct)
        {
            var servers = await FetchServers(ct);
            var list = new List<RTCIceServer>();

            string? Pick(IEnumerable<string> urls, Func<string, bool> predicate) => urls.FirstOrDefault(predicate);

            if (servers != null)
            {
                foreach (var server in servers.OfType<JObject>())
                {
                    var urls = server["urls"] is JArray array ? array.Select((u) => u.ToString()).ToList()
                        : new List<string> { server.Value<string>("urls") ?? "" };
                    var username = server.Value<string>("username");
                    var credential = server.Value<string>("credential");

                    var stun = profile == IceProfile.Udp
                        ? Pick(urls, (u) => u.StartsWith("stun:") && u.EndsWith(":3478"))
                        : Pick(urls, (u) => u.StartsWith("stun:") && u.EndsWith(":443"));
                    stun ??= Pick(urls, (u) => u.StartsWith("stun:"));

                    var turn = profile == IceProfile.Udp
                        ? Pick(urls, (u) => u.StartsWith("turn:") && u.Contains(":3478") && u.Contains("transport=tcp"))
                            ?? Pick(urls, (u) => u.StartsWith("turn:") && u.Contains("transport=tcp"))
                        : Pick(urls, (u) => u.StartsWith("turns:") && u.Contains(":443"));
                    turn ??= Pick(urls, (u) => u.StartsWith("turn"));

                    if (stun != null && !ForceRelay) list.Add(new RTCIceServer { urls = stun });
                    if (turn != null && !string.IsNullOrEmpty(username))
                    {
                        list.Add(new RTCIceServer { urls = turn, username = username, credential = credential, credentialType = RTCIceCredentialType.password });
                    }
                }
            }

            if (list.Count == 0 && !ForceRelay)
            {
                list.Add(new RTCIceServer { urls = "stun:stun.cloudflare.com:3478" });
            }

            return new RTCConfiguration
            {
                iceServers = list,
                iceTransportPolicy = ForceRelay ? RTCIceTransportPolicy.relay : RTCIceTransportPolicy.all,
                X_ICEIncludeAllInterfaceAddresses = false,
            };
        }
    }

    public static class LtHttp
    {
        public static readonly HttpClient Client = CreateClient();

        static HttpClient CreateClient()
        {
            var client = new HttpClient(new SocketsHttpHandler
            {
                PooledConnectionLifetime = TimeSpan.FromMinutes(5),
                ConnectTimeout = TimeSpan.FromSeconds(10),
            })
            {
                Timeout = TimeSpan.FromSeconds(45),
            };
            client.DefaultRequestHeaders.UserAgent.ParseAdd("FocalSonic-ListenTogether/1");
            return client;
        }
    }
}
