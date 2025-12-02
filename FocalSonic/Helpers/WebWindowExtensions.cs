using FocalSonic.Presence;
using IgniteView.Core;
using IgniteView.Desktop;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FocalSonic.Helpers
{
    public static class WebWindowExtensions
    {
        public static WebWindow WithPlatformBasedAdditions(this WebWindow window)
        {
            var mode = Win32WebWindow.WindowBackgroundMode.Acrylic;

            try
            {
                var vibrancyMode = LocalStorage.GetItem("vibrancy", "windows");

                if (vibrancyMode == "acrylic")
                {
                    mode = Win32WebWindow.WindowBackgroundMode.Acrylic;
                }
                else if (vibrancyMode == "mica")
                {
                    mode = Win32WebWindow.WindowBackgroundMode.Mica;
                }
                else if (vibrancyMode == "mica-alt")
                {
                    mode = Win32WebWindow.WindowBackgroundMode.DarkMica;
                }
                else if (vibrancyMode == "blurbehind")
                {
                    mode = Win32WebWindow.WindowBackgroundMode.BlurBehind;
                }
                else if (vibrancyMode == "disabled")
                {
                    mode = Win32WebWindow.WindowBackgroundMode.Disabled;
                }
            }
            catch { }

            return window
                .With((w) => { if (!PlatformManager.HasPlatformHint("macos")) w.WithoutTitleBar(); })
                .With((w) => { if (w is Win32WebWindow) (w as Win32WebWindow)!.BackgroundMode = mode; });
        }

        [Command("setWindowVibrancy")]
        public static void SetWindowVibrancy(string vibrancyMode, WebWindow ctx)
        {
            LocalStorage.SetItem("vibrancy", vibrancyMode, "windows");
            Program.CreateMainWindow();
        }
    }
}
