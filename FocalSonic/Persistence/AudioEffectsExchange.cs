using IgniteView.Core;
using IgniteView.FileDialogs;
using Newtonsoft.Json;
using System;
using System.IO;
using System.Threading.Tasks;

namespace FocalSonic.OverrideSystem
{
    /// <summary>
    /// Native import/export of the audio effects config as JSON. JS owns the
    /// validation; this runs the OS dialog and file IO, returning a JSON status.
    /// </summary>
    public class AudioEffectsExchange
    {
        static FileFilter[] JsonFilter => new FileFilter[] { new FileFilter("Audio Effects Configuration", "json") };

        const string DefaultExportName = "focalsonic-audio-effects.json";

        // A configuration is a few KB; this only guards against being handed something huge.
        const long MaxImportSize = 1 * 1024 * 1024;

        [Command("exportAudioEffects")]
        public static async Task<string> ExportAudioEffects(string json)
        {
            try
            {
                string? path = null;

                // NFD's Win32 backend drives a COM dialog that needs the STA UI thread
                await Program.App.InvokeOnMainThread(async () =>
                {
                    path = await FileDialog.SaveFile(JsonFilter, DefaultExportName);
                });

                if (string.IsNullOrWhiteSpace(path))
                {
                    return Status(ok: false, cancelled: true);
                }

                // The picker doesn't force the filter's extension on, so make sure of it
                if (!path.EndsWith(".json", StringComparison.OrdinalIgnoreCase))
                {
                    path += ".json";
                }

                await File.WriteAllTextAsync(path, json ?? string.Empty);
                return Status(ok: true);
            }
            catch (Exception ex)
            {
                return Status(ok: false, error: ex.Message);
            }
        }

        [Command("importAudioEffects")]
        public static async Task<string> ImportAudioEffects()
        {
            try
            {
                string? path = null;

                await Program.App.InvokeOnMainThread(async () =>
                {
                    path = await FileDialog.PickFile(JsonFilter);
                });

                if (string.IsNullOrWhiteSpace(path))
                {
                    return Status(ok: false, cancelled: true);
                }

                if (!File.Exists(path))
                {
                    return Status(ok: false, error: "the selected file no longer exists");
                }

                if (new FileInfo(path).Length > MaxImportSize)
                {
                    return Status(ok: false, error: "that file is too large to be an audio effects configuration");
                }

                var content = await File.ReadAllTextAsync(path);

                // The content is validated on the JS side before it is applied
                return JsonConvert.SerializeObject(new { ok = true, content });
            }
            catch (Exception ex)
            {
                return Status(ok: false, error: ex.Message);
            }
        }

        static string Status(bool ok, bool cancelled = false, string? error = null)
            => JsonConvert.SerializeObject(new { ok, cancelled, error });
    }
}
