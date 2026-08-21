using System;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using IgniteView.Core;

namespace FocalSonic.Casting.AirPlay
{
    // Spawns and supervises the AirPlay module (args-only, no IPC); its exit is treated
    // as a disconnect. Debug builds run airplay.py straight from the source tree with a
    // Python that has its dependencies (the source dir is embedded as assembly metadata by
    // the csproj) so it can be iterated without recompiling and never runs a stale copy;
    // Release builds run the self-contained Nuitka binary shipped per-platform-and-
    // architecture under the IgniteView native runtime folder (see the build-airplay
    // scripts in FocalSonic.Airplay). If neither is available, AirPlay is simply
    // unavailable.
    //
    // Windows and Linux both work the same way here — the module itself deals with the
    // per-platform difference in how the browser's audio gets captured. macOS is excluded
    // because it does AirPlay natively.
    public class AirPlaySession
    {
        Process? _process;
        bool _stopping;
        readonly object _lock = new();

        // Invoked once when the module process exits and we did not ask it to stop.
        public Action? OnExited;

        public static bool IsAvailable => ResolveModule() != null;

        public bool Start(CastDeviceReference device, int hostPid)
        {
            var module = ResolveModule();
            if (module == null) return false;

            var psi = new ProcessStartInfo
            {
                FileName = module.Value.FileName,
                UseShellExecute = false,
                CreateNoWindow = true,
                RedirectStandardError = true,
                RedirectStandardOutput = true,
            };

            // Dev mode runs "python airplay.py …"; the script path goes first.
            if (!string.IsNullOrEmpty(module.Value.ScriptPath))
            {
                psi.ArgumentList.Add(module.Value.ScriptPath);
            }

            psi.ArgumentList.Add("--host-pid");
            psi.ArgumentList.Add(hostPid.ToString());
            psi.ArgumentList.Add("--name");
            psi.ArgumentList.Add(device.Name ?? "AirPlay device");

            // Store pairing credentials + logs under the app's existing data folder
            // (e.g. %LOCALAPPDATA%\IgniteViewApp\focalsonic\Airplay on Windows,
            // ~/.local/share/IgniteViewApp/focalsonic/Airplay on Linux).
            try
            {
                var dataDir = AppManager.Instance?.CurrentIdentity?.AppDataPath;
                if (!string.IsNullOrEmpty(dataDir))
                {
                    psi.ArgumentList.Add("--data-dir");
                    psi.ArgumentList.Add(dataDir);
                }
            }
            catch { }

            if (!string.IsNullOrEmpty(device.AirPlayAddress))
            {
                psi.ArgumentList.Add("--address");
                psi.ArgumentList.Add(device.AirPlayAddress);
            }
            if (!string.IsNullOrEmpty(device.AirPlayIdentifier))
            {
                psi.ArgumentList.Add("--identifier");
                psi.ArgumentList.Add(device.AirPlayIdentifier);
            }

            // In dev mode, crank up logging so the full pyatv pairing exchange (incl.
            // the device's pair-setup TLV response) lands in airplay.log for diagnosis.
            if (!string.IsNullOrEmpty(module.Value.ScriptPath))
            {
                psi.ArgumentList.Add("--log-level");
                psi.ArgumentList.Add("DEBUG");
            }

            try
            {
                lock (_lock)
                {
                    _stopping = false;
                    _process = new Process { StartInfo = psi, EnableRaisingEvents = true };
                    _process.Exited += HandleProcessExited;
                    _process.ErrorDataReceived += (_, e) => LogLine(e.Data);
                    _process.OutputDataReceived += (_, e) => LogLine(e.Data);
                    _process.Start();
                    _process.BeginErrorReadLine();
                    _process.BeginOutputReadLine();
                }
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AirPlay] Failed to start module: {ex.Message}");
                _process = null;
                return false;
            }
        }

        public void Stop()
        {
            Process? proc;
            lock (_lock)
            {
                _stopping = true;
                proc = _process;
                _process = null;
            }

            if (proc == null) return;
            try
            {
                if (!proc.HasExited)
                {
                    proc.Kill(entireProcessTree: true);
                }
            }
            catch { }
            finally
            {
                try { proc.Dispose(); } catch { }
            }
        }

        void HandleProcessExited(object? sender, EventArgs e)
        {
            bool notify;
            lock (_lock)
            {
                notify = !_stopping;
                _process = null;
            }

            if (sender is Process p)
            {
                Console.WriteLine($"[AirPlay] Module exited with code {SafeExitCode(p)}");
            }

            if (notify) OnExited?.Invoke();
        }

        static int SafeExitCode(Process p)
        {
            try { return p.ExitCode; } catch { return -1; }
        }

        static void LogLine(string? line)
        {
            if (!string.IsNullOrEmpty(line)) Console.WriteLine($"[AirPlay] {line}");
        }

        // ----- module resolution ------------------------------------------

        struct ModuleCommand
        {
            public string FileName;     // a Python interpreter (dev) or the bundled binary (prod)
            public string ScriptPath;   // airplay.py (dev) or "" (prod)
        }

        static ModuleCommand? _cached;
        static bool _resolved;

        // The module's file name inside the native runtime folder.
        static string ModuleFileName =>
            OperatingSystem.IsWindows() ? "focalsonic-airplay.exe" : "focalsonic-airplay";

        static ModuleCommand? ResolveModule()
        {
            if (_resolved) return _cached;
            _resolved = true;

            // macOS does AirPlay natively, so the module is Windows + Linux only.
            if (!OperatingSystem.IsWindows() && !OperatingSystem.IsLinux())
            {
                _cached = null;
                return null;
            }

            // Development: Debug builds embed the source module dir as assembly metadata
            // (see the csproj). Run airplay.py straight from there with a Python that has
            // the module's dependencies, so edits take effect without a ~15-min Nuitka
            // recompile — and so a stale copied snapshot can never run. Release builds
            // don't embed it, so this is skipped and the bundled binary is used.
            var sourceDir = SourceModuleDir();
            if (sourceDir != null)
            {
                var script = Path.Combine(sourceDir, "airplay.py");
                if (File.Exists(script))
                {
                    var python = FindPython(sourceDir);
                    if (python != null)
                    {
                        _cached = new ModuleCommand { FileName = python, ScriptPath = script };
                        return _cached;
                    }
                }
            }

            // Production: the bundled, self-contained binary, shipped in the module's own
            // folder inside IgniteView's native runtime —
            // iv2runtime/<platform>-<arch>/native/airplay/focalsonic-airplay[.exe].
            var bundled = Path.Combine(
                AppContext.BaseDirectory, "iv2runtime", NativeRuntimeFolder(), "native", "airplay",
                ModuleFileName);
            if (File.Exists(bundled))
            {
                EnsureExecutable(bundled);
                _cached = new ModuleCommand { FileName = bundled, ScriptPath = "" };
                return _cached;
            }

            _cached = null;
            return null;
        }

        // Absolute path to the AirPlay source module dir, embedded as assembly metadata
        // by the csproj in Debug builds (null in Release). Lets the host run the module
        // straight from source instead of a copied-and-possibly-stale snapshot.
        static string? SourceModuleDir()
        {
            foreach (var attr in typeof(AirPlaySession).Assembly
                         .GetCustomAttributes(typeof(System.Reflection.AssemblyMetadataAttribute), false))
            {
                if (attr is System.Reflection.AssemblyMetadataAttribute meta
                    && meta.Key == "FocalSonicAirPlayModuleDir"
                    && !string.IsNullOrEmpty(meta.Value))
                {
                    try { return Path.GetFullPath(meta.Value); }
                    catch { return meta.Value; }
                }
            }
            return null;
        }

        // The IgniteView native-runtime folder for the current OS + process architecture.
        static string NativeRuntimeFolder()
        {
            var arch = RuntimeInformation.ProcessArchitecture switch
            {
                Architecture.Arm64 => "arm64",
                _ => "x64",
            };
            return (OperatingSystem.IsLinux() ? "linux-" : "win-") + arch;
        }

        // Git doesn't always preserve the executable bit, and neither do some archive
        // formats, so make sure the bundled Linux binary can actually be launched.
        static void EnsureExecutable(string path)
        {
            if (OperatingSystem.IsWindows()) return;

            try
            {
                var mode = File.GetUnixFileMode(path);
                var wanted = mode | UnixFileMode.UserExecute | UnixFileMode.GroupExecute
                             | UnixFileMode.OtherExecute;
                if (mode != wanted) File.SetUnixFileMode(path, wanted);
            }
            catch { }
        }

        static string? FindPython(string sourceDir)
        {
            // A virtualenv inside the module dir wins. Distro Pythons are increasingly
            // "externally managed" (PEP 668) so pip refuses to install into them, which
            // makes `python3 -m venv .venv && .venv/bin/pip install -r requirements.txt`
            // the normal way to get pyatv in place for a Linux dev build.
            var venv = Path.Combine(sourceDir, ".venv",
                                    OperatingSystem.IsWindows() ? "Scripts" : "bin",
                                    OperatingSystem.IsWindows() ? "python.exe" : "python");
            if (File.Exists(venv) && HasModuleDependencies(venv)) return venv;

            // Allow an explicit override for unusual dev setups.
            var overridePath = Environment.GetEnvironmentVariable("FOCALSONIC_PYTHON");
            if (!string.IsNullOrEmpty(overridePath) && File.Exists(overridePath)
                && HasModuleDependencies(overridePath))
            {
                return overridePath;
            }

            var candidates = OperatingSystem.IsWindows()
                ? new[] { "python", "python3", "py" }
                : new[] { "python3", "python" };

            foreach (var candidate in candidates)
            {
                if (CanRun(candidate, "--version", 4000) && HasModuleDependencies(candidate))
                {
                    return candidate;
                }
            }
            return null;
        }

        // An interpreter is only usable if the module's dependencies are installed for
        // it. Checking here (once — the result is cached) is what keeps Casting from
        // advertising an AirPlay device that would fail the moment it's picked, on a dev
        // machine where they never were.
        //
        // find_spec locates pyatv without importing it: actually importing costs ~8s the
        // first time (it pulls in aiohttp, cryptography, protobuf, zeroconf...), and this
        // check sits in front of the device picker.
        static bool HasModuleDependencies(string python)
            => CanRun(python,
                      "-c \"import importlib.util, sys; sys.exit(0 if importlib.util.find_spec('pyatv') else 1)\"",
                      10000);

        static bool CanRun(string fileName, string arguments, int timeoutMs)
        {
            try
            {
                var psi = new ProcessStartInfo
                {
                    FileName = fileName,
                    Arguments = arguments,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                };
                using var p = Process.Start(psi);
                if (p == null) return false;
                if (!p.WaitForExit(timeoutMs))
                {
                    try { p.Kill(entireProcessTree: true); } catch { }
                    return false;
                }
                return p.ExitCode == 0;
            }
            catch
            {
                return false;
            }
        }
    }
}
