using System;
using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;
using IgniteView.Core;

namespace FocalSonic.Casting.AirPlay
{
    // Spawns and supervises the Python AirPlay module (args-only, no IPC); its exit
    // is treated as a disconnect. Prefers a bundled exe (prod, not built yet), else
    // runs airplay.py with the system Python (dev).
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

            // Python script path first (dev), then the module args.
            if (!string.IsNullOrEmpty(module.Value.ScriptPath))
            {
                psi.ArgumentList.Add(module.Value.ScriptPath);
            }

            psi.ArgumentList.Add("--host-pid");
            psi.ArgumentList.Add(hostPid.ToString());
            psi.ArgumentList.Add("--name");
            psi.ArgumentList.Add(device.Name ?? "AirPlay device");

            // Store pairing credentials + logs under the app's existing data folder
            // (e.g. %LOCALAPPDATA%\IgniteViewApp\focalsonic\Airplay).
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
            public string FileName;     // python.exe (dev) or the bundled exe (prod)
            public string ScriptPath;   // airplay.py (dev) or "" (prod)
        }

        static ModuleCommand? _cached;
        static bool _resolved;

        static ModuleCommand? ResolveModule()
        {
#if !WINDOWS
            // Only Windows is supported for now (Linux planned, macOS is native).
            return null;
#else
            if (_resolved) return _cached;
            _resolved = true;

            var moduleDir = Path.Combine(AppContext.BaseDirectory, "airplay");

            // Production: a bundled, self-contained executable.
            var bundledExe = Path.Combine(moduleDir, "focalsonic-airplay.exe");
            if (File.Exists(bundledExe))
            {
                _cached = new ModuleCommand { FileName = bundledExe, ScriptPath = "" };
                return _cached;
            }

            // Development: the Python script run with the system Python.
            var script = Path.Combine(moduleDir, "airplay.py");
            if (File.Exists(script))
            {
                var python = FindPython();
                if (python != null)
                {
                    _cached = new ModuleCommand { FileName = python, ScriptPath = script };
                    return _cached;
                }
            }

            _cached = null;
            return null;
#endif
        }

        static string? FindPython()
        {
            // Allow an explicit override for unusual dev setups.
            var overridePath = Environment.GetEnvironmentVariable("FOCALSONIC_PYTHON");
            if (!string.IsNullOrEmpty(overridePath) && File.Exists(overridePath)) return overridePath;

            foreach (var candidate in new[] { "python", "python3", "py" })
            {
                if (CanRun(candidate)) return candidate;
            }
            return null;
        }

        static bool CanRun(string fileName)
        {
            try
            {
                var psi = new ProcessStartInfo
                {
                    FileName = fileName,
                    Arguments = "--version",
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                };
                using var p = Process.Start(psi);
                if (p == null) return false;
                p.WaitForExit(4000);
                return p.HasExited && p.ExitCode == 0;
            }
            catch
            {
                return false;
            }
        }
    }
}
