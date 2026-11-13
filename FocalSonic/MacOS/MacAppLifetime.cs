#if MACOS

using IgniteView.Core;
using System.Runtime.InteropServices;

namespace FocalSonic.MacOS
{
    /// <summary>
    /// macOS app lifetime, the counterpart of the Windows tray icon and LinuxAppLifetime:
    /// closing the window keeps the music playing, clicking the Dock icon brings the window
    /// back, and quitting shuts the helper down cleanly.
    /// </summary>
    public static class MacAppLifetime
    {
        [DllImport("libc")] static extern void _exit(int status);

        public static void Setup()
        {
            // Runs as soon as IgniteView's run loop starts servicing the main queue.
            MainThread.Post(Install);
        }

        static unsafe void Install()
        {
            var application = ObjC.Send(ObjC.Class("NSApplication"), "sharedApplication");

            // IgniteView's native runtime doesn't install an app delegate. Should a later
            // version bring one, extend it rather than replace it.
            var appDelegate = ObjC.Send(application, "delegate");
            if (appDelegate == IntPtr.Zero) appDelegate = ObjC.NewObject("FocalSonicAppDelegate");

            ObjC.Implement(appDelegate, "applicationShouldTerminateAfterLastWindowClosed:",
                (IntPtr)(delegate* unmanaged<IntPtr, IntPtr, IntPtr, byte>)&ShouldTerminateAfterLastWindowClosed,
                ObjC.Bool + "@:@");
            ObjC.Implement(appDelegate, "applicationShouldHandleReopen:hasVisibleWindows:",
                (IntPtr)(delegate* unmanaged<IntPtr, IntPtr, IntPtr, byte, byte>)&ShouldHandleReopen,
                ObjC.Bool + "@:@" + ObjC.Bool);
            ObjC.Implement(appDelegate, "applicationShouldTerminate:",
                (IntPtr)(delegate* unmanaged<IntPtr, IntPtr, IntPtr, nuint>)&ShouldTerminate,
                "Q@:@");

            // AppKit caches which optional methods its delegate implements when it's assigned.
            ObjC.Send(application, "setDelegate:", IntPtr.Zero);
            ObjC.Send(application, "setDelegate:", appDelegate);
        }

        [UnmanagedCallersOnly]
        static byte ShouldTerminateAfterLastWindowClosed(IntPtr self, IntPtr selector, IntPtr application) => 0;

        [UnmanagedCallersOnly]
        static byte ShouldHandleReopen(IntPtr self, IntPtr selector, IntPtr application, byte hasVisibleWindows)
        {
            try
            {
                if (Program.MainWindow == null) Program.CreateMainWindow();
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine("Couldn't reopen the main window: " + ex);
            }
            return 1; // Let AppKit also un-minimise it.
        }

        [UnmanagedCallersOnly]
        static nuint ShouldTerminate(IntPtr self, IntPtr selector, IntPtr application)
        {
            Quit();
            return 0; // NSTerminateCancel; not reached.
        }

        public static void Quit()
        {
            try { MacHelper.Shutdown(); } catch { }
            try { Program.App?.ViteProcess?.Kill(true); } catch { }
            try { File.Delete(Program.LockFilePath); } catch { }

            Console.Out.Flush();
            Console.Error.Flush();

            // Leave without running C++ static destructors: IgniteView's native runtime
            // crashes tearing down its web views during a normal exit().
            _exit(0);
        }

        /// <summary>A native alert, for errors that need the user's attention.</summary>
        public static void ShowAlert(string title, string message)
        {
            MainThread.Post(() =>
            {
                var application = ObjC.Send(ObjC.Class("NSApplication"), "sharedApplication");
                ObjC.Send(application, "activateIgnoringOtherApps:", 1);

                var alert = ObjC.Send(ObjC.Send(ObjC.Class("NSAlert"), "alloc"), "init");
                ObjC.Send(alert, "setMessageText:", ObjC.String(title));
                ObjC.Send(alert, "setInformativeText:", ObjC.String(message));
                ObjC.Send(alert, "runModal");
                ObjC.Send(alert, "release");
            });
        }
    }
}

#endif
