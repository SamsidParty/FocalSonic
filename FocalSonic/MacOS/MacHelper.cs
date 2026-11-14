#if MACOS

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Collections.Concurrent;
using System.Diagnostics;

namespace FocalSonic.MacOS
{
    public class MacHelperException(string message) : Exception(message) { }

    /// <summary>
    /// Talks to FocalSonicHelper (FocalSonic.MacHelper), the native companion process that
    /// hosts MusicKit playback, the audio effects engine and the system Now Playing entry.
    /// MusicKit only serves clients with a bundle identity in their code signature, which the
    /// helper has, so FocalSonic itself can stay a plain .NET executable.
    /// One line of JSON per message in each direction; see Sources/IPC.swift in the helper.
    /// </summary>
    public sealed class MacHelper
    {
        public const string ExecutableName = "FocalSonicHelper";

        static readonly object InstanceLock = new();
        static MacHelper? CurrentInstance;
        static int Launches;

        /// <summary>The running helper, started (or restarted after a crash) on demand.</summary>
        public static MacHelper Instance
        {
            get
            {
                lock (InstanceLock)
                {
                    if (CurrentInstance == null || CurrentInstance.HasExited)
                    {
                        CurrentInstance = new MacHelper(++Launches);
                    }
                    return CurrentInstance;
                }
            }
        }

        /// <summary>Only the instance that is already running, without starting one.</summary>
        public static MacHelper? RunningInstance
        {
            get { lock (InstanceLock) { return CurrentInstance is { HasExited: false } ? CurrentInstance : null; } }
        }

        // Events from whichever instance is current, so subscribers survive a restart.
        public static event Action<JObject>? StateChanged;
        public static event Action<string>? TrackEnded;
        /// <summary>MusicKit moved to the queued next track (or back) by itself: playback id, "next"/"previous", duration.</summary>
        public static event Action<string, string, double>? TrackAdvanced;
        public static event Action<string, string>? VariantChanged;
        public static event Action<string, double?>? RemoteCommand;
        public static event Action<bool, string?>? EffectsChanged;
        /// <summary>FocalSonic's AirPlay route started or ended: active, the speakers' names, and why it failed (if it did).</summary>
        public static event Action<bool, string[], string?>? AirPlayChanged;

        /// <summary>Changes every time the helper is relaunched; state it held must be resent.</summary>
        public int Generation { get; }
        public bool HasExited => Process.HasExited;

        readonly Process Process;
        readonly ConcurrentDictionary<int, TaskCompletionSource<JObject>> Pending = new();
        readonly TaskCompletionSource Ready = new(TaskCreationOptions.RunContinuationsAsynchronously);
        readonly object WriteLock = new();
        int NextID;
        bool AirPlayActive;

        MacHelper(int generation)
        {
            Generation = generation;

            var path = Path.Combine(AppContext.BaseDirectory, ExecutableName);
            if (!File.Exists(path))
            {
                throw new MacHelperException($"{ExecutableName} is missing from {AppContext.BaseDirectory}; rebuild FocalSonic on macOS.");
            }

            var startInfo = new ProcessStartInfo(path)
            {
                UseShellExecute = false,
                RedirectStandardInput = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
            };

            Process = new Process { StartInfo = startInfo, EnableRaisingEvents = true };
            Process.Exited += (_, _) =>
            {
                FailPending("FocalSonicHelper exited unexpectedly");

                // Its AirPlay route went with it.
                if (AirPlayActive)
                {
                    AirPlayActive = false;
                    AirPlayChanged?.Invoke(false, [], null);
                }
            };
            Process.Start();

            _ = Task.Run(ReadMessagesAsync);
            _ = Task.Run(ReadDiagnosticsAsync);
        }

        /// <summary>Sends a command and waits for its reply. Throws <see cref="MacHelperException"/> if it fails.</summary>
        public async Task<JObject> Send(string command, object? arguments = null, TimeSpan? timeout = null)
        {
            var limit = timeout ?? TimeSpan.FromSeconds(30);
            if (await Task.WhenAny(Ready.Task, Task.Delay(limit)) != Ready.Task)
            {
                throw new MacHelperException("FocalSonicHelper didn't start");
            }

            var id = Interlocked.Increment(ref NextID);
            var message = arguments == null ? new JObject() : JObject.FromObject(arguments);
            message["id"] = id;
            message["cmd"] = command;

            var reply = new TaskCompletionSource<JObject>(TaskCreationOptions.RunContinuationsAsynchronously);
            Pending[id] = reply;

            try
            {
                lock (WriteLock)
                {
                    Process.StandardInput.WriteLine(message.ToString(Formatting.None));
                    Process.StandardInput.Flush();
                }
            }
            catch (Exception ex)
            {
                Pending.TryRemove(id, out _);
                throw new MacHelperException($"Couldn't reach FocalSonicHelper: {ex.Message}");
            }

            if (await Task.WhenAny(reply.Task, Task.Delay(limit)) != reply.Task)
            {
                Pending.TryRemove(id, out _);
                throw new MacHelperException($"FocalSonicHelper didn't answer '{command}'");
            }

            var result = await reply.Task;
            if (result.Value<bool?>("ok") != true)
            {
                throw new MacHelperException(result.Value<string>("error") ?? $"'{command}' failed");
            }
            return result;
        }

        /// <summary>Sends a command without waiting; failures are only logged.</summary>
        public void Post(string command, object? arguments = null)
        {
            _ = Task.Run(async () =>
            {
                try { await Send(command, arguments); }
                catch (Exception ex) { Console.Error.WriteLine($"[MacHelper] {command}: {ex.Message}"); }
            });
        }

        /// <summary>Asks the helper to exit, which also releases any audio capture it holds.</summary>
        public static void Shutdown()
        {
            var running = RunningInstance;
            if (running == null) return;

            try
            {
                lock (running.WriteLock)
                {
                    running.Process.StandardInput.WriteLine("{\"cmd\":\"shutdown\"}");
                    running.Process.StandardInput.Close();
                }
                if (!running.Process.WaitForExit(1500)) running.Process.Kill();
            }
            catch { }
        }

        async Task ReadMessagesAsync()
        {
            try
            {
                string? line;
                while ((line = await Process.StandardOutput.ReadLineAsync()) != null)
                {
                    if (string.IsNullOrWhiteSpace(line)) continue;

                    try { Dispatch(JObject.Parse(line)); }
                    catch (Exception ex) { Console.Error.WriteLine($"[MacHelper] Bad message: {ex.Message}"); }
                }
            }
            finally
            {
                FailPending("FocalSonicHelper exited unexpectedly");
            }
        }

        async Task ReadDiagnosticsAsync()
        {
            string? line;
            while ((line = await Process.StandardError.ReadLineAsync()) != null)
            {
                Console.Error.WriteLine(line);
            }
        }

        void Dispatch(JObject message)
        {
            if (message.TryGetValue("reply", out var replyID))
            {
                if (Pending.TryRemove(replyID.Value<int>(), out var pending)) pending.TrySetResult(message);
                return;
            }

            // Events from a helper that has since been replaced are stale.
            if (!ReferenceEquals(this, RunningInstance) && message.Value<string>("event") != "ready") return;

            switch (message.Value<string>("event"))
            {
                case "ready":
                    Ready.TrySetResult();
                    break;
                case "state":
                    StateChanged?.Invoke(message);
                    break;
                case "ended":
                    TrackEnded?.Invoke(message.Value<string>("id") ?? "");
                    break;
                case "advanced":
                    TrackAdvanced?.Invoke(message.Value<string>("id") ?? "", message.Value<string>("direction") ?? "next", message.Value<double?>("duration") ?? 0);
                    break;
                case "variant":
                    VariantChanged?.Invoke(message.Value<string>("id") ?? "", message.Value<string>("variant") ?? "");
                    break;
                case "remote":
                    RemoteCommand?.Invoke(message.Value<string>("command") ?? "", message.Value<double?>("time"));
                    break;
                case "effects":
                    EffectsChanged?.Invoke(message.Value<bool?>("active") == true, message.Value<string>("error"));
                    break;
                case "airplay":
                    AirPlayActive = message.Value<bool?>("active") == true;
                    var speakers = message["speakers"]?.Values<string>().OfType<string>().ToArray() ?? [];
                    AirPlayChanged?.Invoke(AirPlayActive, speakers, message.Value<string>("error"));
                    break;
            }
        }

        void FailPending(string reason)
        {
            Ready.TrySetResult(); // Let waiting senders fail fast instead of timing out.
            foreach (var id in Pending.Keys)
            {
                if (Pending.TryRemove(id, out var pending)) pending.TrySetException(new MacHelperException(reason));
            }
        }
    }
}

#endif
