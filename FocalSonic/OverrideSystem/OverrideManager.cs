using IgniteView.Core;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;

namespace FocalSonic.OverrideSystem
{
    /// <summary>
    /// Allows the user to manually override certain assets like lyrics.
    /// </summary>
    public class OverrideManager
    {
        public static string OverridesDirectory => Path.Join(AppManager.Instance.CurrentIdentity.AppDataPath, "Overrides");
        public static string LyricOverridesDirectory => Path.Join(OverridesDirectory, "Lyrics");

        public static void Setup()
        {
            Directory.CreateDirectory(OverridesDirectory);
            Directory.CreateDirectory(LyricOverridesDirectory);
        }

        [Command("saveLyricOverride")]
        public static async Task SaveLyricOverride(string trackId, string content)
        {
            var filePath = Path.Join(LyricOverridesDirectory, $"{trackId}.txt");
            await File.WriteAllTextAsync(filePath, content);
        }

        [Command("getLyricOverride")]
        public static async Task<string?> GetLyricOverride(string trackId)
        {
            var filePath = Path.Join(LyricOverridesDirectory, $"{trackId}.txt");
            if (File.Exists(filePath))
            {
                return await File.ReadAllTextAsync(filePath);
            }
            return null;
        }

        [Command("openOverridesDirectory")]
        public static void ShowInExplorer(string? subPath)
        {
            var folderPath = OverridesDirectory;

            if (!string.IsNullOrEmpty(subPath))
            {
                folderPath = Path.Join(OverridesDirectory, subPath);
            }

            // If it's a file, open it in notepad instead of explorer
            if (File.Exists(folderPath))
            {
                if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
                {
                    Process.Start("notepad.exe", folderPath);
                }
                return;
            }

            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            {
                Process.Start("explorer.exe", folderPath);
            }
            else if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
            {
                Process.Start("xdg-open", folderPath);
            }
            else if (RuntimeInformation.IsOSPlatform(OSPlatform.OSX))
            {
                Process.Start("open", folderPath);
            }
        }
    }
}
