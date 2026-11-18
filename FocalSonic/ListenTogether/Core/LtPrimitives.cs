using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Channels;

namespace FocalSonic.ListenTogether.Core
{
    /// <summary>
    /// A monotonic millisecond clock. Wall clocks jump (NTP, sleep, the user changing the
    /// time), which would yank everyone's playback around, so all timing in a session is
    /// measured on this and translated between peers with <see cref="ClockSync"/>.
    /// </summary>
    public static class MonoClock
    {
        static readonly Stopwatch Watch = Stopwatch.StartNew();
        public static double NowMs => Watch.Elapsed.TotalMilliseconds;
    }

    /// <summary>
    /// Estimates the offset between this machine's <see cref="MonoClock"/> and the host's,
    /// NTP style. Each ping gives an offset with an error bound of RTT/2, so of the recent
    /// samples the one with the smallest round trip wins. That keeps a congested or lossy
    /// connection (where most round trips are inflated by queueing or retransmits) from
    /// skewing the estimate: one quick exchange is enough.
    /// </summary>
    public class ClockSync
    {
        record Sample(double Offset, double Rtt, double At);

        const int Window = 24;
        const double MaxSampleAgeMs = 90_000;

        readonly List<Sample> samples = new();
        readonly object gate = new();

        public double OffsetMs { get; private set; }
        public double BestRttMs { get; private set; } = double.NaN;
        public int SampleCount { get { lock (gate) return samples.Count; } }
        public bool IsSynced => SampleCount >= 2;

        /// <summary>t0: local send, t1: host receive, t2: host send, t3: local receive.</summary>
        public void AddSample(double t0, double t1, double t2, double t3)
        {
            var rtt = (t3 - t0) - (t2 - t1);
            if (rtt < 0 || double.IsNaN(rtt) || rtt > 30_000) return;

            var offset = ((t1 - t0) + (t2 - t3)) / 2;

            lock (gate)
            {
                samples.Add(new Sample(offset, rtt, t3));
                samples.RemoveAll((s) => t3 - s.At > MaxSampleAgeMs);
                while (samples.Count > Window) samples.RemoveAt(0);

                var best = samples.MinBy((s) => s.Rtt)!;

                // Clocks drift apart by a few ppm, so a sample's offset ages. Among samples
                // whose round trip is close to the best, prefer the newest.
                var candidate = samples.Where((s) => s.Rtt <= best.Rtt + 4).MaxBy((s) => s.At)!;

                OffsetMs = candidate.Offset;
                BestRttMs = best.Rtt;
            }
        }

        public double HostNowMs => MonoClock.NowMs + OffsetMs;

        public void Reset()
        {
            lock (gate) samples.Clear();
            OffsetMs = 0;
            BestRttMs = double.NaN;
        }
    }

    /// <summary>
    /// Where the shared playback is: at host time <see cref="HostTimeMs"/> the entry was
    /// at <see cref="Position"/> seconds and moving at <see cref="Rate"/> (if playing).
    /// Everyone, the host's own player included, follows this line rather than the host's
    /// audio, so one participant's buffering never drags the others along.
    /// </summary>
    public class PlaybackAnchor
    {
        public string? EntryId { get; set; }
        /// <summary>Bumped every time a track starts, so a repeat of the same entry is a new play.</summary>
        public int PlayId { get; set; }
        public double Position { get; set; }
        public double HostTimeMs { get; set; }
        public double Rate { get; set; } = 1;
        public bool Playing { get; set; }
        /// <summary>The track is starting and the host hasn't heard it begin yet.</summary>
        public bool Pending { get; set; }
        public double Duration { get; set; }
        public int Seq { get; set; }

        public double PositionAt(double hostNowMs)
        {
            if (!Playing || Pending) return Position;
            var position = Position + (hostNowMs - HostTimeMs) / 1000.0 * Rate;
            return Duration > 0 ? Math.Min(position, Duration) : position;
        }

        public PlaybackAnchor Clone() => (PlaybackAnchor)MemberwiseClone();
    }

    /// <summary>Runs work one item at a time, in order, off the caller's thread.</summary>
    public sealed class SerialExecutor : IDisposable
    {
        readonly Channel<Func<Task>> work = Channel.CreateUnbounded<Func<Task>>(new UnboundedChannelOptions { SingleReader = true });
        readonly CancellationTokenSource stop = new();
        readonly string name;

        public SerialExecutor(string name)
        {
            this.name = name;
            _ = Task.Run(Loop);
        }

        async Task Loop()
        {
            try
            {
                await foreach (var item in work.Reader.ReadAllAsync(stop.Token))
                {
                    try { await item(); }
                    catch (Exception ex) { LtLog.Error($"{name}: {ex}"); }
                }
            }
            catch (OperationCanceledException) { }
        }

        public void Post(Func<Task> action) => work.Writer.TryWrite(action);
        public void Post(Action action) => work.Writer.TryWrite(() => { action(); return Task.CompletedTask; });

        public Task<T> Run<T>(Func<Task<T>> action)
        {
            var completion = new TaskCompletionSource<T>(TaskCreationOptions.RunContinuationsAsynchronously);
            Post(async () =>
            {
                try { completion.TrySetResult(await action()); }
                catch (Exception ex) { completion.TrySetException(ex); }
            });
            return completion.Task;
        }

        public Task Run(Func<Task> action) => Run<bool>(async () => { await action(); return true; });

        public void Dispose()
        {
            work.Writer.TryComplete();
            stop.Cancel();
        }
    }

    public static class LtLog
    {
        static readonly Queue<string> Recent = new();
        public static Action<string>? Sink;

        static void Write(string level, string message)
        {
            var line = $"{DateTime.Now:HH:mm:ss.fff} [ListenTogether] {level}{message}";
            lock (Recent)
            {
                Recent.Enqueue(line);
                while (Recent.Count > 400) Recent.Dequeue();
            }
            if (Sink != null) Sink(line);
            else if (level.Length > 0) Console.Error.WriteLine(line);
            else Console.WriteLine(line);
        }

        public static readonly bool DebugEnabled = Environment.GetEnvironmentVariable("FOCALSONIC_LT_DEBUG") == "1";

        public static void Debug(string message) { if (DebugEnabled) Write("DEBUG ", message); }
        public static void Info(string message) => Write("", message);
        public static void Warn(string message) => Write("WARN ", message);
        public static void Error(string message) => Write("ERROR ", message);

        public static string Dump()
        {
            lock (Recent) return string.Join("\n", Recent);
        }
    }

    /// <summary>
    /// Join codes: 16 Crockford base32 characters shown as XXXX-XXXX-XXXX-XXXX. 15 are random
    /// (75 bits, far beyond guessing, especially with the signaling server's rate limit) and
    /// the last is a check character, so a typo says "mistyped" rather than "no session".
    /// The code never leaves the device in the clear: the signaling server only sees a hash
    /// of it, and signaling messages are encrypted with a key derived from it.
    /// </summary>
    public static class JoinCode
    {
        const string Alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
        public const int Length = 16;

        public static string Generate()
        {
            var chars = new char[Length];
            for (int i = 0; i < Length - 1; i++) chars[i] = Alphabet[RandomNumberGenerator.GetInt32(32)];
            chars[Length - 1] = Alphabet[Checksum(chars.AsSpan(0, Length - 1))];
            return new string(chars);
        }

        static int Checksum(ReadOnlySpan<char> body)
        {
            int sum = 0;
            for (int i = 0; i < body.Length; i++) sum += (i + 1) * Alphabet.IndexOf(body[i]) + (i * 7);
            return sum % 32;
        }

        public static string Format(string code) =>
            string.Join("-", Enumerable.Range(0, code.Length / 4).Select((i) => code.Substring(i * 4, 4)));

        public enum ParseResult { Ok, Empty, WrongLength, InvalidCharacters, Mistyped }

        /// <summary>Accepts the code with any spacing, dashes or case, or a link that ends with it.</summary>
        public static ParseResult TryParse(string? input, out string code)
        {
            code = string.Empty;
            if (string.IsNullOrWhiteSpace(input)) return ParseResult.Empty;

            var text = input.Trim();

            // focalsonic://join/CODE, https://.../join?code=CODE and so on.
            var queryIndex = text.IndexOf("code=", StringComparison.OrdinalIgnoreCase);
            if (queryIndex >= 0) text = text[(queryIndex + 5)..].Split('&', '#')[0];
            else if (text.Contains('/')) text = text.TrimEnd('/').Split('/').Last();

            var builder = new StringBuilder();
            foreach (var raw in text.ToUpperInvariant())
            {
                if (raw == '-' || char.IsWhiteSpace(raw) || raw == '_' || raw == '.') continue;
                var c = raw switch { 'O' => '0', 'I' => '1', 'L' => '1', 'U' => 'V', _ => raw };
                if (Alphabet.IndexOf(c) < 0) return ParseResult.InvalidCharacters;
                builder.Append(c);
            }

            if (builder.Length == 0) return ParseResult.Empty;
            if (builder.Length != Length) return ParseResult.WrongLength;

            var candidate = builder.ToString();
            if (Alphabet[Checksum(candidate.AsSpan(0, Length - 1))] != candidate[Length - 1]) return ParseResult.Mistyped;

            code = candidate;
            return ParseResult.Ok;
        }

        /// <summary>The signaling inbox for a session: a hash, so the server never learns the code.</summary>
        public static string RoomId(string code) =>
            Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes("focalsonic-listen-together/room/v1:" + code)))[..40].ToLowerInvariant();

        public static byte[] SignalingKey(string code) =>
            HKDF.DeriveKey(HashAlgorithmName.SHA256, Encoding.UTF8.GetBytes(code), 32,
                Encoding.UTF8.GetBytes("focalsonic-listen-together"), Encoding.UTF8.GetBytes("signal-key/v1"));
    }

    /// <summary>
    /// AES-GCM over signaling messages. Besides privacy this authenticates them: the SDP
    /// carries the DTLS fingerprints that secure the peer connection, so if the signaling
    /// server (or anyone in between) could swap them it could sit in the middle. Without
    /// the join code it can't produce a message that decrypts.
    /// </summary>
    public sealed class SignalingCipher
    {
        readonly byte[] key;

        public SignalingCipher(string code) { key = JoinCode.SignalingKey(code); }

        public string Seal(string plaintext)
        {
            var data = Encoding.UTF8.GetBytes(plaintext);
            var nonce = RandomNumberGenerator.GetBytes(12);
            var cipher = new byte[data.Length];
            var tag = new byte[16];

            using (var aes = new AesGcm(key, 16)) aes.Encrypt(nonce, data, cipher, tag);

            var output = new byte[1 + nonce.Length + tag.Length + cipher.Length];
            output[0] = 1; // version
            nonce.CopyTo(output, 1);
            tag.CopyTo(output, 13);
            cipher.CopyTo(output, 29);
            return Convert.ToBase64String(output);
        }

        public bool TryOpen(string sealedText, out string plaintext)
        {
            plaintext = string.Empty;
            try
            {
                var input = Convert.FromBase64String(sealedText);
                if (input.Length < 29 || input[0] != 1) return false;

                var nonce = input.AsSpan(1, 12);
                var tag = input.AsSpan(13, 16);
                var cipher = input.AsSpan(29);
                var data = new byte[cipher.Length];

                using (var aes = new AesGcm(key, 16)) aes.Decrypt(nonce, cipher, tag, data);
                plaintext = Encoding.UTF8.GetString(data);
                return true;
            }
            catch
            {
                return false;
            }
        }
    }

    public static class LtIds
    {
        const string Chars = "abcdefghijkmnpqrstuvwxyz23456789";
        public static string New(int length = 10)
        {
            var chars = new char[length];
            for (int i = 0; i < length; i++) chars[i] = Chars[RandomNumberGenerator.GetInt32(Chars.Length)];
            return new string(chars);
        }

        public static string Secret() => Convert.ToHexString(RandomNumberGenerator.GetBytes(24)).ToLowerInvariant();

        public static string Hash(string value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value))).ToLowerInvariant();
    }
}
