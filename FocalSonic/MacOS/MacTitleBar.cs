#if MACOS

using IgniteView.Core;
using System.Runtime.InteropServices;

namespace FocalSonic.MacOS
{
    /// <summary>
    /// Drops the native title bar so FocalSonic's header reaches the top of the window, keeping the
    /// traffic lights on top of it, centred in the header's 70px gap for them. IgniteView's
    /// WithoutTitleBar() can't be used for this: on macOS it hides the traffic lights too.
    /// </summary>
    public static class MacTitleBar
    {
        const long FullSizeContentView = 1 << 15; // NSWindowStyleMaskFullSizeContentView
        const long FullScreen = 1 << 14;          // NSWindowStyleMaskFullScreen
        const long TitleHidden = 1;               // NSWindowTitleHidden
        const long SeparatorNone = 1;             // NSTitlebarSeparatorStyleNone
        const double HeaderHeight = 44;           // --header-height in src-vite/src/index.css

        static readonly long[] Buttons = { 0, 1, 2 }; // NSWindowCloseButton, MiniaturizeButton, ZoomButton

        static IntPtr Observer;

        /// <summary>What each window's notifications are registered on, to unregister when it closes.</summary>
        static readonly Dictionary<IntPtr, IntPtr[]> Observed = new();

        /// <summary>Each window's buttons' x offsets from the close button, as AppKit spaced them.</summary>
        static readonly Dictionary<IntPtr, double[]> ButtonOffsets = new();

        /// <summary>Windows with a layout already queued by a button move.</summary>
        static readonly HashSet<IntPtr> Queued = new();

        public static void Apply(WebWindow window)
        {
            var title = window.Title;

            MainThread.Post(() =>
            {
                // A respawned main window shares its title with the one it replaces, which is
                // already set up, so only set up windows that aren't yet.
                foreach (var nsWindow in WindowsTitled(title))
                {
                    if ((StyleMask(nsWindow) & FullSizeContentView) == 0) Install(nsWindow);
                }
            });
        }

        static void Install(IntPtr window)
        {
            ObjC.Send(window, "setStyleMask:", StyleMask(window) | FullSizeContentView);
            ObjC.Send(window, "setTitlebarAppearsTransparent:", 1);
            ObjC.Send(window, "setTitleVisibility:", TitleHidden);
            ObjC.Send(window, "setTitlebarSeparatorStyle:", SeparatorNone);

            var container = TitlebarContainer(window);
            if (container == IntPtr.Zero) return;

            // AppKit restores its own title bar layout on every resize (and a few other changes, like
            // the title), so redo ours after each. A button can't be moved from inside its own frame
            // notification (AppKit ignores it), so a button move only queues a redo for afterwards.
            var observed = new List<IntPtr> { container, window };
            ObjC.Send(container, "setPostsFrameChangedNotifications:", 1);
            AddObserver("titlebarFrameChanged:", "NSViewFrameDidChangeNotification", container);
            AddObserver("windowChanged:", "NSWindowDidResizeNotification", window);
            AddObserver("windowChanged:", "NSWindowDidExitFullScreenNotification", window);
            AddObserver("windowWillClose:", "NSWindowWillCloseNotification", window);

            // AppKit's spacing between the buttons, taken before we've moved any of them.
            var closeX = ObjC.SendRect(ObjC.Send(window, "standardWindowButton:", 0), "frame").X;
            var offsets = new double[Buttons.Length];

            for (var i = 0; i < Buttons.Length; i++)
            {
                var button = ObjC.Send(window, "standardWindowButton:", Buttons[i]);
                if (button == IntPtr.Zero) continue;

                offsets[i] = ObjC.SendRect(button, "frame").X - closeX;
                ObjC.Send(button, "setPostsFrameChangedNotifications:", 1);
                AddObserver("buttonMoved:", "NSViewFrameDidChangeNotification", button);
                observed.Add(button);
            }

            Observed[window] = observed.ToArray();
            ButtonOffsets[window] = offsets;

            Layout(window);
        }

        /// <summary>Makes the title bar as tall as the header and centres the traffic lights in it.</summary>
        static void Layout(IntPtr window)
        {
            // In fullscreen the traffic lights live in AppKit's slide-down title bar; leave them be.
            var styleMask = StyleMask(window);
            if ((styleMask & FullSizeContentView) == 0 || (styleMask & FullScreen) != 0) return;

            var container = TitlebarContainer(window);
            if (container == IntPtr.Zero) return;

            // The container sits in the window's (unflipped) frame view, so y counts from the bottom.
            var windowHeight = ObjC.SendRect(window, "frame").Height;
            var frame = ObjC.SendRect(container, "frame");
            if (frame.Height != HeaderHeight || frame.Y != windowHeight - HeaderHeight)
            {
                frame.Height = HeaderHeight;
                frame.Y = windowHeight - HeaderHeight;
                ObjC.Send(container, ObjC.Selector("setFrame:"), frame);
            }

            // Centre the close button as far from the window's left edge as from its top, so the gaps
            // to both edges match; the other two keep AppKit's spacing from it.
            if (!ButtonOffsets.TryGetValue(window, out var offsets)) return;
            var left = Math.Round((HeaderHeight - ObjC.SendRect(ObjC.Send(window, "standardWindowButton:", 0), "frame").Width) / 2);

            for (var i = 0; i < Buttons.Length; i++)
            {
                var button = ObjC.Send(window, "standardWindowButton:", Buttons[i]);
                if (button == IntPtr.Zero) continue;

                var buttonFrame = ObjC.SendRect(button, "frame");
                var x = left + offsets[i];
                var y = Math.Round((HeaderHeight - buttonFrame.Height) / 2);
                if (buttonFrame.X == x && buttonFrame.Y == y) continue;

                buttonFrame.X = x;
                buttonFrame.Y = y;
                ObjC.Send(button, ObjC.Selector("setFrame:"), buttonFrame);
            }
        }

        /// <summary>The traffic lights' title bar view sits in a container that spans the window's top edge.</summary>
        static IntPtr TitlebarContainer(IntPtr window)
        {
            var close = ObjC.Send(window, "standardWindowButton:", 0);
            if (close == IntPtr.Zero) return IntPtr.Zero;

            var titlebar = ObjC.Send(close, "superview");
            return titlebar == IntPtr.Zero ? IntPtr.Zero : ObjC.Send(titlebar, "superview");
        }

        static long StyleMask(IntPtr window) => ObjC.SendLong(window, ObjC.Selector("styleMask"));

        static IEnumerable<IntPtr> WindowsTitled(string? title)
        {
            var windows = ObjC.Send(ObjC.Send(ObjC.Class("NSApplication"), "sharedApplication"), "windows");
            var count = ObjC.SendLong(windows, ObjC.Selector("count"));

            for (long i = 0; i < count; i++)
            {
                var window = ObjC.Send(windows, "objectAtIndex:", i);
                if (ObjC.ToString(ObjC.Send(window, "title")) == title) yield return window;
            }
        }

        static IntPtr NotificationCenter => ObjC.Send(ObjC.Class("NSNotificationCenter"), "defaultCenter");

        static void AddObserver(string selector, string notification, IntPtr sender)
        {
            ObjC.Send(NotificationCenter, ObjC.Selector("addObserver:selector:name:object:"),
                GetObserver(), ObjC.Selector(selector), ObjC.String(notification), sender);
        }

        static unsafe IntPtr GetObserver()
        {
            if (Observer != IntPtr.Zero) return Observer;

            Observer = ObjC.NewObject("FocalSonicTitlebarObserver");
            ObjC.Implement(Observer, "titlebarFrameChanged:",
                (IntPtr)(delegate* unmanaged<IntPtr, IntPtr, IntPtr, void>)&TitlebarFrameChanged, "v@:@");
            ObjC.Implement(Observer, "windowChanged:",
                (IntPtr)(delegate* unmanaged<IntPtr, IntPtr, IntPtr, void>)&WindowChanged, "v@:@");
            ObjC.Implement(Observer, "buttonMoved:",
                (IntPtr)(delegate* unmanaged<IntPtr, IntPtr, IntPtr, void>)&ButtonMoved, "v@:@");
            ObjC.Implement(Observer, "windowWillClose:",
                (IntPtr)(delegate* unmanaged<IntPtr, IntPtr, IntPtr, void>)&WindowWillClose, "v@:@");

            return Observer;
        }

        [UnmanagedCallersOnly]
        static void TitlebarFrameChanged(IntPtr self, IntPtr selector, IntPtr notification)
        {
            try
            {
                var window = ObjC.Send(ObjC.Send(notification, "object"), "window");
                if (window != IntPtr.Zero) Layout(window);
            }
            catch (Exception ex) { Console.Error.WriteLine("Title bar layout failed: " + ex); }
        }

        [UnmanagedCallersOnly]
        static void WindowChanged(IntPtr self, IntPtr selector, IntPtr notification)
        {
            try { Layout(ObjC.Send(notification, "object")); }
            catch (Exception ex) { Console.Error.WriteLine("Title bar layout failed: " + ex); }
        }

        [UnmanagedCallersOnly]
        static void ButtonMoved(IntPtr self, IntPtr selector, IntPtr notification)
        {
            try
            {
                var window = ObjC.Send(ObjC.Send(notification, "object"), "window");
                if (window == IntPtr.Zero || !Queued.Add(window)) return;

                MainThread.Post(() =>
                {
                    Queued.Remove(window);
                    if (Observed.ContainsKey(window)) Layout(window);
                });
            }
            catch (Exception ex) { Console.Error.WriteLine("Title bar layout failed: " + ex); }
        }

        [UnmanagedCallersOnly]
        static void WindowWillClose(IntPtr self, IntPtr selector, IntPtr notification)
        {
            try
            {
                var window = ObjC.Send(notification, "object");
                ButtonOffsets.Remove(window);
                if (!Observed.Remove(window, out var senders)) return;

                foreach (var sender in senders)
                {
                    ObjC.Send(NotificationCenter, ObjC.Selector("removeObserver:name:object:"), Observer, IntPtr.Zero, sender);
                }
            }
            catch (Exception ex) { Console.Error.WriteLine("Title bar cleanup failed: " + ex); }
        }
    }
}

#endif
