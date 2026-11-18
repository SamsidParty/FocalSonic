using FocalSonic.ListenTogether.Core;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Net;
using System.Text;

namespace FocalSonic.ListenTogether.Transport
{
    public class SignalingException : Exception
    {
        public HttpStatusCode? Status { get; }
        public SignalingException(string message, HttpStatusCode? status = null) : base(message) { Status = status; }

        public bool IsNotFound => Status == HttpStatusCode.NotFound;
        public bool IsRateLimited => Status == (HttpStatusCode)429;
    }

    /// <summary>
    /// Client for the signaling mailbox (Services/signal.php). Peers only use it to swap
    /// connection offers; once connected, everything goes over the peer connection.
    /// Inboxes are opened with a secret only their owner knows: anyone with the address can
    /// post to one, only the owner can read it. Message bodies are sealed by the caller.
    /// </summary>
    public class SignalingClient
    {
        public static string DefaultEndpoint =>
            Environment.GetEnvironmentVariable("FOCALSONIC_LT_SIGNAL_URL") ?? "https://www.samsidparty.com/Services/focalsonic/signal.php";

        public const int ProtocolVersion = 1;

        readonly string endpoint;

        public SignalingClient(string? endpoint = null) { this.endpoint = endpoint ?? DefaultEndpoint; }

        async Task<JObject> Call(JObject request, CancellationToken ct, TimeSpan? timeout = null)
        {
            request["v"] = ProtocolVersion;

            using var linked = CancellationTokenSource.CreateLinkedTokenSource(ct);
            linked.CancelAfter(timeout ?? TimeSpan.FromSeconds(15));

            HttpResponseMessage response;
            try
            {
                using var content = new StringContent(request.ToString(Formatting.None), Encoding.UTF8, "application/json");
                response = await LtHttp.Client.PostAsync(endpoint, content, linked.Token);
            }
            catch (OperationCanceledException) when (!ct.IsCancellationRequested)
            {
                throw new SignalingException("The session server didn't respond in time.");
            }
            catch (HttpRequestException ex)
            {
                throw new SignalingException("Couldn't reach the session server: " + ex.Message);
            }

            using (response)
            {
                var text = await response.Content.ReadAsStringAsync(ct);
                JObject? body = null;
                try { body = JObject.Parse(text); } catch { }

                if (!response.IsSuccessStatusCode || body?.Value<bool?>("ok") != true)
                {
                    var error = body?.Value<string>("error") ?? $"HTTP {(int)response.StatusCode}";
                    throw new SignalingException(error, response.StatusCode);
                }

                return body!;
            }
        }

        /// <summary>Creates the inbox, or keeps it alive if it's already ours.</summary>
        public Task Open(string inbox, string secret, int ttlSeconds, CancellationToken ct) =>
            Call(new JObject { ["a"] = "open", ["inbox"] = inbox, ["secret"] = secret, ["ttl"] = ttlSeconds }, ct);

        public Task Send(string inbox, string body, CancellationToken ct) =>
            Call(new JObject { ["a"] = "send", ["inbox"] = inbox, ["body"] = body }, ct);

        public async Task<(List<string> Messages, long Cursor)> Receive(string inbox, string secret, long after, int waitSeconds, CancellationToken ct)
        {
            var result = await Call(new JObject
            {
                ["a"] = "recv",
                ["inbox"] = inbox,
                ["secret"] = secret,
                ["after"] = after,
                ["wait"] = waitSeconds,
            }, ct, TimeSpan.FromSeconds(waitSeconds + 15));

            var messages = new List<string>();
            var cursor = result.Value<long?>("cursor") ?? after;

            foreach (var message in (result["messages"] as JArray) ?? new JArray())
            {
                var body = message.Value<string>("b");
                if (body != null) messages.Add(body);
            }

            return (messages, cursor);
        }

        public async Task Close(string inbox, string secret)
        {
            try
            {
                using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(5));
                await Call(new JObject { ["a"] = "close", ["inbox"] = inbox, ["secret"] = secret }, timeout.Token);
            }
            catch (Exception ex)
            {
                LtLog.Warn("Couldn't close signaling inbox: " + ex.Message);
            }
        }
    }

    /// <summary>
    /// An inbox this peer owns: keeps it alive and hands over each (decrypted) message.
    /// </summary>
    public sealed class SignalingInbox : IAsyncDisposable
    {
        public string Address { get; }
        readonly string secret;
        readonly SignalingClient client;
        readonly SignalingCipher cipher;
        readonly CancellationTokenSource stop = new();
        readonly int ttlSeconds;
        Task? pump;
        Task? keepAlive;

        public event Action<JObject>? MessageReceived;
        public event Action<string>? Faulted;

        public SignalingInbox(SignalingClient client, SignalingCipher cipher, string address, int ttlSeconds = 90)
        {
            this.client = client;
            this.cipher = cipher;
            Address = address;
            secret = LtIds.Secret();
            this.ttlSeconds = ttlSeconds;
        }

        public async Task Open(CancellationToken ct)
        {
            await client.Open(Address, secret, ttlSeconds, ct);
            pump = Task.Run(Pump);
            keepAlive = Task.Run(KeepAlive);
        }

        async Task KeepAlive()
        {
            while (!stop.IsCancellationRequested)
            {
                try
                {
                    await Task.Delay(TimeSpan.FromSeconds(ttlSeconds / 3.0), stop.Token);
                    await client.Open(Address, secret, ttlSeconds, stop.Token);
                }
                catch (OperationCanceledException) { return; }
                catch (Exception ex)
                {
                    LtLog.Warn("Signaling keep-alive failed: " + ex.Message);
                }
            }
        }

        async Task Pump()
        {
            long cursor = 0;
            var failures = 0;

            while (!stop.IsCancellationRequested)
            {
                try
                {
                    var (messages, next) = await client.Receive(Address, secret, cursor, 20, stop.Token);
                    cursor = next;
                    failures = 0;

                    foreach (var sealedMessage in messages)
                    {
                        if (!cipher.TryOpen(sealedMessage, out var plaintext))
                        {
                            LtLog.Warn("Dropped a signaling message that didn't decrypt");
                            continue;
                        }

                        try { MessageReceived?.Invoke(JObject.Parse(plaintext)); }
                        catch (Exception ex) { LtLog.Error("Signaling message handler failed: " + ex); }
                    }
                }
                catch (OperationCanceledException) when (stop.IsCancellationRequested) { return; }
                catch (Exception ex)
                {
                    failures++;
                    if (ex is SignalingException { IsNotFound: true })
                    {
                        // Expired (e.g. the machine slept); claim it again.
                        try { await client.Open(Address, secret, ttlSeconds, stop.Token); } catch { }
                    }

                    if (failures == 6) Faulted?.Invoke(ex.Message);
                    var delay = Math.Min(1000 * Math.Pow(2, Math.Min(failures, 5)), 20_000);
                    try { await Task.Delay(TimeSpan.FromMilliseconds(delay), stop.Token); } catch (OperationCanceledException) { return; }
                }
            }
        }

        public async ValueTask DisposeAsync()
        {
            if (stop.IsCancellationRequested) return;
            stop.Cancel();
            await client.Close(Address, secret);
        }
    }
}
