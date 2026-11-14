#if MACOS

using System.Runtime.InteropServices;

namespace FocalSonic.MacOS
{
    /// <summary>
    /// The menu bar icon shown while FocalSonic plays in the background with its window closed,
    /// the counterpart of the Windows and Linux tray icons. It's the only way back to the app
    /// then, as MacAppLifetime takes the Dock icon away too. Main thread only.
    /// </summary>
    public static class MacStatusItem
    {
        const double SquareLength = -2; // NSSquareStatusItemLength
        const double VariableLength = -1; // NSVariableStatusItemLength
        const double IconHeight = 16; // points; MenuBarIcon.png is drawn at 2x

        static IntPtr StatusItem;
        static IntPtr Target;

        public static void Show()
        {
            if (StatusItem != IntPtr.Zero) return;

            var image = LoadIcon();

            // The status bar doesn't keep the item alive itself.
            StatusItem = ObjC.Send(ObjC.Send(StatusBar, ObjC.Selector("statusItemWithLength:"), image == IntPtr.Zero ? SquareLength : VariableLength), "retain");

            var button = ObjC.Send(StatusItem, "button");
            ObjC.Send(button, "setToolTip:", ObjC.String("FocalSonic"));
            if (image != IntPtr.Zero)
            {
                ObjC.Send(button, "setImage:", image);
                ObjC.Send(image, "release");
            }
            else
            {
                ObjC.Send(button, "setImage:", SymbolIcon());
            }

            var menu = ObjC.Send(ObjC.Send(ObjC.Class("NSMenu"), "alloc"), "init");
            AddItem(menu, "Show FocalSonic", "showMainWindow:", "", GetTarget());
            ObjC.Send(menu, "addItem:", ObjC.Send(ObjC.Class("NSMenuItem"), "separatorItem"));
            // Through applicationShouldTerminate:, so it quits the way the app menu's Quit does.
            AddItem(menu, "Quit FocalSonic", "terminate:", "q", Application);

            ObjC.Send(StatusItem, "setMenu:", menu);
            ObjC.Send(menu, "release");
        }

        public static void Hide()
        {
            if (StatusItem == IntPtr.Zero) return;

            ObjC.Send(StatusBar, "removeStatusItem:", StatusItem);
            ObjC.Send(StatusItem, "release");
            StatusItem = IntPtr.Zero;
        }

        static IntPtr Application => ObjC.Send(ObjC.Class("NSApplication"), "sharedApplication");
        static IntPtr StatusBar => ObjC.Send(ObjC.Class("NSStatusBar"), "systemStatusBar");

        /// <summary>The logo as a template image, which AppKit tints to suit the menu bar. Owned by the caller.</summary>
        static IntPtr LoadIcon()
        {
            var path = Path.Combine(AppContext.BaseDirectory, "iv2runtime", "focalsonic-menubar.png");
            if (!File.Exists(path)) return IntPtr.Zero;

            var image = ObjC.Send(ObjC.Send(ObjC.Class("NSImage"), "alloc"), "initWithContentsOfFile:", ObjC.String(path));
            if (image == IntPtr.Zero) return IntPtr.Zero;

            var rep = ObjC.Send(ObjC.Send(image, "representations"), "firstObject");
            var width = ObjC.SendLong(rep, ObjC.Selector("pixelsWide"));
            var height = ObjC.SendLong(rep, ObjC.Selector("pixelsHigh"));

            ObjC.Send(image, ObjC.Selector("setSize:"), new NSSize { Width = IconHeight * width / height, Height = IconHeight });
            ObjC.Send(image, "setTemplate:", 1);
            ObjC.Send(image, "setAccessibilityDescription:", ObjC.String("FocalSonic"));
            return image;
        }

        /// <summary>A stand-in should the logo be missing from the build.</summary>
        static IntPtr SymbolIcon() =>
            ObjC.Send(ObjC.Class("NSImage"), ObjC.Selector("imageWithSystemSymbolName:accessibilityDescription:"),
                ObjC.String("music.note"), ObjC.String("FocalSonic"));

        static void AddItem(IntPtr menu, string title, string action, string keyEquivalent, IntPtr target)
        {
            var item = ObjC.Send(ObjC.Send(ObjC.Class("NSMenuItem"), "alloc"), ObjC.Selector("initWithTitle:action:keyEquivalent:"),
                ObjC.String(title), ObjC.Selector(action), ObjC.String(keyEquivalent));
            ObjC.Send(item, "setTarget:", target);
            ObjC.Send(menu, "addItem:", item);
            ObjC.Send(item, "release");
        }

        static unsafe IntPtr GetTarget()
        {
            if (Target != IntPtr.Zero) return Target;

            Target = ObjC.NewObject("FocalSonicStatusItemTarget");
            ObjC.Implement(Target, "showMainWindow:",
                (IntPtr)(delegate* unmanaged<IntPtr, IntPtr, IntPtr, void>)&ShowMainWindow, "v@:@");
            return Target;
        }

        [UnmanagedCallersOnly]
        static void ShowMainWindow(IntPtr self, IntPtr selector, IntPtr sender)
        {
            try { MacAppLifetime.ShowMainWindow(); }
            catch (Exception ex) { Console.Error.WriteLine("Couldn't show the main window: " + ex); }
        }
    }
}

#endif
