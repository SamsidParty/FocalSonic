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
            return window
                .With((w) => { if (!PlatformManager.HasPlatformHint("macos")) w.WithoutTitleBar(); })
                .With((w) => { if (w is Win32WebWindow) (w as Win32WebWindow)!.BackgroundMode = Win32WebWindow.WindowBackgroundMode.Acrylic; });
        }
    }
}
