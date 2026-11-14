using System.Net;
using System.Net.Sockets;

namespace FocalSonic.Helpers
{
    /// <summary>
    /// HttpClients that connect the way browsers do ("Happy Eyeballs", RFC 8305).
    /// .NET tries a host's addresses one at a time, IPv6 first. On networks that hand out IPv6
    /// addresses but drop IPv6 traffic, each attempt hangs until the OS gives up (over a minute),
    /// so requests time out before IPv4 is ever tried. Here, whenever an attempt hasn't connected
    /// within <see cref="AttemptDelay"/>, the next address (alternating IPv6 and IPv4) is tried
    /// alongside it, and the first connection to succeed is used.
    /// </summary>
    public static class DualStackHttp
    {
        /// <summary>RFC 8305's recommended "Connection Attempt Delay".</summary>
        static readonly TimeSpan AttemptDelay = TimeSpan.FromMilliseconds(250);

        /// <summary>The same defaults as <c>new HttpClient()</c>, plus dual-stack connecting.</summary>
        public static SocketsHttpHandler CreateHandler() => new() { ConnectCallback = ConnectAsync };

        public static HttpClient CreateClient() => new(CreateHandler());

        /// <summary>For <see cref="SocketsHttpHandler.ConnectCallback"/>.</summary>
        public static async ValueTask<Stream> ConnectAsync(SocketsHttpConnectionContext context, CancellationToken cancellationToken)
        {
            var port = context.DnsEndPoint.Port;
            var addresses = Interleave(await Dns.GetHostAddressesAsync(context.DnsEndPoint.Host, cancellationToken));

            using var race = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            var pending = new List<Task<Socket>>();
            var next = 0;
            Exception? lastError = null;

            try
            {
                while (true)
                {
                    if (next < addresses.Count)
                    {
                        pending.Add(ConnectToAsync(addresses[next++], port, race.Token));
                    }
                    else if (pending.Count == 0)
                    {
                        break; // Every address failed.
                    }

                    // While there are addresses left, only wait so long before trying another.
                    var finished = Task.WhenAny(pending);
                    var waited = next < addresses.Count
                        ? await Task.WhenAny(finished, Task.Delay(AttemptDelay, cancellationToken))
                        : finished;

                    cancellationToken.ThrowIfCancellationRequested();
                    if (waited != finished) continue;

                    var attempt = await finished;
                    pending.Remove(attempt);

                    if (attempt.IsCompletedSuccessfully)
                    {
                        return new NetworkStream(attempt.Result, ownsSocket: true);
                    }
                    lastError = attempt.Exception?.InnerException ?? lastError;
                }

                throw lastError ?? new SocketException((int)SocketError.HostNotFound);
            }
            finally
            {
                // Abandon the attempts that lost, closing any that connected anyway.
                race.Cancel();
                foreach (var attempt in pending)
                {
                    _ = attempt.ContinueWith(static (t) =>
                    {
                        if (t.IsCompletedSuccessfully) t.Result.Dispose();
                        else _ = t.Exception; // Observed, so it isn't reported as unhandled.
                    }, TaskScheduler.Default);
                }
            }
        }

        static async Task<Socket> ConnectToAsync(IPAddress address, int port, CancellationToken cancellationToken)
        {
            var socket = new Socket(address.AddressFamily, SocketType.Stream, ProtocolType.Tcp) { NoDelay = true };
            try
            {
                await socket.ConnectAsync(new IPEndPoint(address, port), cancellationToken);
                return socket;
            }
            catch
            {
                socket.Dispose();
                throw;
            }
        }

        /// <summary>Alternates address families, starting with the one the system put first.</summary>
        static List<IPAddress> Interleave(IPAddress[] addresses)
        {
            var ordered = new List<IPAddress>(addresses.Length);
            if (addresses.Length == 0) return ordered;

            var first = addresses[0].AddressFamily;
            var preferred = addresses.Where((a) => a.AddressFamily == first).ToList();
            var others = addresses.Where((a) => a.AddressFamily != first).ToList();

            for (var i = 0; i < Math.Max(preferred.Count, others.Count); i++)
            {
                if (i < preferred.Count) ordered.Add(preferred[i]);
                if (i < others.Count) ordered.Add(others[i]);
            }
            return ordered;
        }
    }
}
