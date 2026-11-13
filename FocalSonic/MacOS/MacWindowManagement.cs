#if MACOS

using IgniteView.Core;

namespace FocalSonic.MacOS
{
    /// <summary>
    /// The mini player on macOS: the same small window as on Windows (see
    /// Windows/WindowManagement.cs), floating above other windows instead of "topmost".
    /// </summary>
    public class MacWindowManagement
    {
        const long NormalWindowLevel = 0;   // NSNormalWindowLevel
        const long FloatingWindowLevel = 3; // NSFloatingWindowLevel

        static bool IsMiniPlayer;

        [Command("enterMiniPlayer")]
        public static void EnterMiniPlayer(WebWindow ctx)
        {
            if (ctx == null || IsMiniPlayer) return;
            IsMiniPlayer = true;

            ctx.Bounds = new WindowBounds(550, 300)
            {
                MinWidth = 300,
                MinHeight = 300,
                MaxWidth = 700,
                MaxHeight = 400,
            };
            SetLevel(ctx, FloatingWindowLevel, center: false);
        }

        [Command("exitMiniPlayer")]
        public static void ExitMiniPlayer(WebWindow ctx)
        {
            if (ctx == null || !IsMiniPlayer) return;
            IsMiniPlayer = false;

            ctx.Bounds = Program.DefaultBounds;
            SetLevel(ctx, NormalWindowLevel, center: true);
        }

        static void SetLevel(WebWindow ctx, long level, bool center)
        {
            var title = ctx.Title;

            MainThread.Post(() =>
            {
                var window = FindWindow(title);
                if (window == IntPtr.Zero) return;

                ObjC.Send(window, "setLevel:", level);
                if (center) ObjC.Send(window, "center");
            });
        }

        /// <summary>IgniteView doesn't expose the NSWindow on macOS, so look it up by title.</summary>
        static IntPtr FindWindow(string? title)
        {
            var application = ObjC.Send(ObjC.Class("NSApplication"), "sharedApplication");
            var windows = ObjC.Send(application, "windows");
            var count = ObjC.SendLong(windows, ObjC.Selector("count"));

            for (long i = 0; i < count; i++)
            {
                var window = ObjC.Send(windows, "objectAtIndex:", i);
                if (ObjC.ToString(ObjC.Send(window, "title")) == title) return window;
            }

            return ObjC.Send(application, "mainWindow");
        }
    }
}

#endif
