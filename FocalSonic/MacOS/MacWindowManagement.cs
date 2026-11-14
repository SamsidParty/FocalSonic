#if MACOS

using IgniteView.Core;
using System.Runtime.InteropServices;

namespace FocalSonic.MacOS
{
    /// <summary>
    /// The mini player on macOS: the same small window as on Windows (see
    /// Windows/WindowManagement.cs), floating above other windows instead of "topmost".
    /// Fullscreen is AppKit's own, kept in step with the green traffic light.
    /// </summary>
    public class MacWindowManagement
    {
        const long NormalWindowLevel = 0;   // NSNormalWindowLevel
        const long FloatingWindowLevel = 3; // NSFloatingWindowLevel
        const long FullScreenStyle = 1 << 14;      // NSWindowStyleMaskFullScreen
        const long FullScreenNone = 1 << 9;        // NSWindowCollectionBehaviorFullScreenNone
        const long FullScreenBehaviors = 7 << 7;   // ...FullScreenPrimary, Auxiliary and None, of which only one may be set

        static readonly long[] TrafficLights = { 0, 1, 2 }; // NSWindowCloseButton, MiniaturizeButton, ZoomButton

        static bool IsMiniPlayer;

        /// <summary>The window's collection behavior from before the mini player took fullscreen away.</summary>
        static long CollectionBehavior;

        /// <summary>
        /// The main window while the app is fullscreen or heading there, and the window AppKit is
        /// animating in or out of fullscreen. NSWindows rather than flags, so a respawned window starts afresh.
        /// </summary>
        static IntPtr FullScreenWindow, TransitioningWindow;

        public static void Setup()
        {
            MainThread.Post(ObserveFullScreen);
        }

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
            ApplyMiniPlayer(ctx, true);
        }

        [Command("exitMiniPlayer")]
        public static void ExitMiniPlayer(WebWindow ctx)
        {
            if (ctx == null || !IsMiniPlayer) return;
            IsMiniPlayer = false;

            ctx.Bounds = Program.DefaultBounds;
            ApplyMiniPlayer(ctx, false);
        }

        [Command("enterFullScreen")]
        public static void EnterFullScreen(WebWindow ctx)
        {
            ExitMiniPlayer(ctx);
            SetFullScreen(ctx, true);
        }

        [Command("exitFullScreen")]
        public static void ExitFullScreen(WebWindow ctx)
        {
            SetFullScreen(ctx, false);
        }

        static void ApplyMiniPlayer(WebWindow ctx, bool miniPlayer)
        {
            var title = ctx.Title;

            MainThread.Post(() =>
            {
                var window = FindWindow(title);
                if (window == IntPtr.Zero) return;

                MacTitleBar.Restore(window); // the new bounds took the header out from under the traffic lights
                ObjC.Send(window, "setLevel:", miniPlayer ? FloatingWindowLevel : NormalWindowLevel);

                // Going fullscreen freezes the mini player, so it has no traffic lights, and no
                // fullscreen at all for the other ways in (the Window menu, Globe-F).
                foreach (var button in TrafficLights)
                {
                    ObjC.Send(ObjC.Send(window, "standardWindowButton:", button), "setHidden:", miniPlayer ? 1 : 0);
                }

                if (miniPlayer) CollectionBehavior = ObjC.SendLong(window, ObjC.Selector("collectionBehavior"));
                ObjC.Send(window, "setCollectionBehavior:",
                    miniPlayer ? (CollectionBehavior & ~FullScreenBehaviors) | FullScreenNone : CollectionBehavior);

                if (!miniPlayer) ObjC.Send(window, "center");
            });
        }

        static void SetFullScreen(WebWindow ctx, bool fullScreen)
        {
            if (ctx == null) return;
            var title = ctx.Title;

            MainThread.Post(() =>
            {
                var window = FindWindow(title);
                if (window == IntPtr.Zero) return;

                FullScreenWindow = fullScreen ? window : IntPtr.Zero;
                SyncFullScreen(window);
            });
        }

        /// <summary>
        /// Takes the window in or out of fullscreen to match the app. AppKit can't be asked to
        /// mid-animation, so then it waits for the animation to end.
        /// </summary>
        static void SyncFullScreen(IntPtr window)
        {
            if (window == TransitioningWindow) return;

            var isFullScreen = (ObjC.SendLong(window, ObjC.Selector("styleMask")) & FullScreenStyle) != 0;
            if (isFullScreen != (window == FullScreenWindow)) ObjC.Send(window, "toggleFullScreen:", IntPtr.Zero);
        }

        static unsafe void ObserveFullScreen()
        {
            var observer = ObjC.NewObject("FocalSonicFullScreenObserver");
            ObjC.Implement(observer, "fullScreenWillChange:",
                (IntPtr)(delegate* unmanaged<IntPtr, IntPtr, IntPtr, void>)&FullScreenWillChange, "v@:@");
            ObjC.Implement(observer, "fullScreenDidChange:",
                (IntPtr)(delegate* unmanaged<IntPtr, IntPtr, IntPtr, void>)&FullScreenDidChange, "v@:@");

            // Every window's (a nil object), as the main window is respawned with a new NSWindow.
            var center = ObjC.Send(ObjC.Class("NSNotificationCenter"), "defaultCenter");
            foreach (var (selector, name) in new[]
            {
                ("fullScreenWillChange:", "NSWindowWillEnterFullScreenNotification"),
                ("fullScreenWillChange:", "NSWindowWillExitFullScreenNotification"),
                ("fullScreenDidChange:", "NSWindowDidEnterFullScreenNotification"),
                ("fullScreenDidChange:", "NSWindowDidExitFullScreenNotification"),
            })
            {
                ObjC.Send(center, ObjC.Selector("addObserver:selector:name:object:"),
                    observer, ObjC.Selector(selector), ObjC.String(name), IntPtr.Zero);
            }
        }

        [UnmanagedCallersOnly]
        static void FullScreenWillChange(IntPtr self, IntPtr selector, IntPtr notification)
        {
            try
            {
                var window = ObjC.Send(notification, "object");
                if (!IsMainWindow(window)) return;
                TransitioningWindow = window;

                // Not the app's doing but the green traffic light's (or the Window menu's): have the
                // app follow it, the way F11 does on Windows.
                var entering = ObjC.ToString(ObjC.Send(notification, "name")) == "NSWindowWillEnterFullScreenNotification";
                if (entering == (window == FullScreenWindow)) return;

                FullScreenWindow = entering ? window : IntPtr.Zero;
                var mainWindow = Program.MainWindow;
                Task.Run(() => mainWindow?.ExecuteJavaScript($"window.onNativeFullscreenChange?.({(entering ? "true" : "false")})"));
            }
            catch (Exception ex) { Console.Error.WriteLine("Fullscreen sync failed: " + ex); }
        }

        [UnmanagedCallersOnly]
        static void FullScreenDidChange(IntPtr self, IntPtr selector, IntPtr notification)
        {
            try
            {
                var window = ObjC.Send(notification, "object");
                if (window != TransitioningWindow) return;

                // The app may have toggled fullscreen again while it was animating.
                TransitioningWindow = IntPtr.Zero;
                SyncFullScreen(window);
            }
            catch (Exception ex) { Console.Error.WriteLine("Fullscreen sync failed: " + ex); }
        }

        static bool IsMainWindow(IntPtr window)
        {
            var title = Program.MainWindow?.Title;
            return title != null && ObjC.ToString(ObjC.Send(window, "title")) == title;
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
