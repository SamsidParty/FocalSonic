using IgniteView.Core;
using Newtonsoft.Json;
using System;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Threading.Tasks;
using System.Web;
using WatsonWebserver.Core;

namespace FocalSonic.OverrideSystem
{
    /// <summary>
    /// Custom impulse responses from imported configs. Only one is kept on disk
    /// so repeated imports can't fill the overrides folder with orphaned wavs.
    /// </summary>
    public class ImpulseOverrides
    {
        /// <summary>Matches CUSTOM_IMPULSE_PREFIX in src-vite/src/utils/audioEffects.ts</summary>
        public const string IdPrefix = "custom-";

        public const long MaxFileSize = 32 * 1024 * 1024;

        /// <summary>Smallest possible canonical RIFF/WAVE header.</summary>
        const int MinFileSize = 44;

        public static string ImpulseOverridesDirectory => Path.Join(OverrideManager.OverridesDirectory, "Impulse");

        /// <summary>
        /// Validates a wav and copies it into the overrides folder, replacing any
        /// previous one. Returns JSON {"ok":true,"id":...} or {"ok":false,"error":...}.
        /// </summary>
        [Command("importImpulseOverride")]
        public static async Task<string> ImportImpulseOverride(string sourcePath)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(sourcePath))
                {
                    return Failure("no impulse response path was given");
                }

                var fullPath = Path.GetFullPath(sourcePath.Trim());

                if (!File.Exists(fullPath))
                {
                    return Failure($"the impulse response \"{sourcePath}\" does not exist");
                }

                if (!Path.GetExtension(fullPath).Equals(".wav", StringComparison.OrdinalIgnoreCase))
                {
                    return Failure("the impulse response must be a .wav file");
                }

                var info = new FileInfo(fullPath);

                if (info.Length < MinFileSize)
                {
                    return Failure("the impulse response is too small to be valid audio");
                }

                if (info.Length > MaxFileSize)
                {
                    return Failure($"the impulse response is larger than {MaxFileSize / (1024 * 1024)} MB");
                }

                var bytes = await File.ReadAllBytesAsync(fullPath);

                if (!IsRiffWave(bytes))
                {
                    return Failure("the impulse response is not a valid wav file");
                }

                // Content addressed, so re-importing the same wav is a no-op and a
                // different one always gets a fresh URL the webview won't have cached
                var id = IdPrefix + Convert.ToHexString(SHA256.HashData(bytes))[..12].ToLowerInvariant();
                var targetPath = Path.Join(ImpulseOverridesDirectory, id + ".wav");

                Directory.CreateDirectory(ImpulseOverridesDirectory);

                foreach (var existing in Directory.EnumerateFiles(ImpulseOverridesDirectory))
                {
                    if (string.Equals(existing, targetPath, StringComparison.OrdinalIgnoreCase)) { continue; }

                    try { File.Delete(existing); }
                    catch (Exception ex) { Console.Error.WriteLine("Failed to clean up old impulse override: " + ex.Message); }
                }

                if (!File.Exists(targetPath))
                {
                    await File.WriteAllBytesAsync(targetPath, bytes);
                }

                return JsonConvert.SerializeObject(new { ok = true, id });
            }
            catch (Exception ex)
            {
                return Failure(ex.Message);
            }
        }

        /// <summary>
        /// Serves an imported impulse response to the Apple Music proxy window, which
        /// can't reach the app data folder any other way.
        /// </summary>
        public static async Task ImpulseOverrideRoute(HttpContextBase ctx)
        {
            // CORS
            if (!ctx.Request.HeaderExists("Origin") || ctx.Request.RetrieveHeaderValue("Origin") == "127.0.0.1" || ctx.Request.RetrieveHeaderValue("Origin") == "localhost")
            {
                ctx.Response.Headers.Add("Access-Control-Allow-Origin", "*");
                ctx.Response.Headers.Add("Access-Control-Allow-Headers", "*");
            }

            // The uri will be in the format /impulse?custom-0a1b2c3d4e5f
            var path = ResolveOverridePath(HttpUtility.UrlDecode(ctx.Request.Query.Querystring));

            if (path == null || !File.Exists(path))
            {
                ctx.Response.StatusCode = 404;
                await ctx.Response.Send("Impulse response not found.");
                return;
            }

            // Ids are content hashes, so the bytes behind one can never change
            ctx.Response.Headers["Cache-Control"] = "public, max-age=31536000, immutable";
            ctx.Response.Headers["Content-Type"] = "audio/wav";
            ctx.Response.StatusCode = 200;
            await ctx.Response.Send(await File.ReadAllBytesAsync(path));
        }

        /// <summary>
        /// Turns an impulse id into a path inside the overrides folder, or null if it
        /// isn't one of ours or tries to climb out of the folder.
        /// </summary>
        static string? ResolveOverridePath(string? id)
        {
            if (string.IsNullOrWhiteSpace(id)) { return null; }
            if (!id.StartsWith(IdPrefix, StringComparison.Ordinal)) { return null; }
            if (!id.All(c => char.IsAsciiLetterOrDigit(c) || c == '-')) { return null; }

            var directory = Path.GetFullPath(ImpulseOverridesDirectory);
            var candidate = Path.GetFullPath(Path.Join(directory, id + ".wav"));

            if (!candidate.StartsWith(directory + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }

            return candidate;
        }

        static bool IsRiffWave(byte[] bytes)
        {
            return bytes.Length >= 12
                && bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
                && bytes[8] == 'W' && bytes[9] == 'A' && bytes[10] == 'V' && bytes[11] == 'E';
        }

        static string Failure(string error) => JsonConvert.SerializeObject(new { ok = false, error });
    }
}
