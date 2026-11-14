#if MACOS

using IgniteView.Core;
using IgniteView.Desktop;
using System.Runtime.InteropServices;

namespace FocalSonic.MacOS
{
    /// <summary>
    /// macOS app lifetime, the counterpart of the Windows tray icon and LinuxAppLifetime:
    /// closing the window keeps the music playing in the background, with a menu bar icon (and
    /// no Dock icon) to bring the window back, and quitting shuts the helper down cleanly.
    /// </summary>
    public static class MacAppLifetime
    {
        [DllImport("libc")] static extern void _exit(int status);

        const long RegularPolicy = 0;   // NSApplicationActivationPolicyRegular
        const long AccessoryPolicy = 1; // NSApplicationActivationPolicyAccessory

        /// <summary>
        /// Each main window's NSWindow, and the WebWindow it belongs to, until it closes. Main thread only.
        /// IgniteView doesn't expose the NSWindow on macOS, nor tell the app when the user closes it.
        /// </summary>
        static readonly Dictionary<IntPtr, WebWindow> MainWindows = new();

        static bool InBackground;

        public static void Setup()
        {
            KeepRunningWithoutWindows();

            // Runs as soon as IgniteView's run loop starts servicing the main queue.
            MainThread.Post(Install);
        }

        /// <summary>
        /// IgniteView's runtime stops AppKit's run loop when the user closes the last window, so that
        /// the app exits, and saucer can't start it again. FocalSonic stays running in the background,
        /// so it turns that off; IgniteView checks this flag each time a window closes.
        /// </summary>
        static void KeepRunningWithoutWindows()
        {
            try
            {
                // Where IgniteView's import resolver loads it from, so this is the copy already loaded.
                var path = Path.Join(AppContext.BaseDirectory, "iv2runtime", "osx-universal", "native", "lib" + InteropHelper.DLLName + ".dylib");
                if (NativeLibrary.TryLoad(path, out var runtime) && NativeLibrary.TryGetExport(runtime, "QuitOnLastWindowClosed", out var flag))
                {
                    Marshal.WriteByte(flag, 0); // a C++ bool
                    return;
                }
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine(ex);
            }

            Console.Error.WriteLine("Couldn't keep IgniteView running without windows; closing the window will quit FocalSonic.");
        }

        static unsafe void Install()
        {
            var application = Application;

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

            // Every window's (a nil object): the main window is respawned with a new NSWindow.
            var observer = ObjC.NewObject("FocalSonicLifetimeObserver");
            ObjC.Implement(observer, "windowWillClose:",
                (IntPtr)(delegate* unmanaged<IntPtr, IntPtr, IntPtr, void>)&WindowWillClose, "v@:@");
            ObjC.Send(ObjC.Send(ObjC.Class("NSNotificationCenter"), "defaultCenter"), ObjC.Selector("addObserver:selector:name:object:"),
                observer, ObjC.Selector("windowWillClose:"), ObjC.String("NSWindowWillCloseNotification"), IntPtr.Zero);
        }

        static IntPtr Application => ObjC.Send(ObjC.Class("NSApplication"), "sharedApplication");

        /// <summary>Program.CreateMainWindow calls this once the new main window is showing.</summary>
        public static void MainWindowShown(WebWindow window)
        {
            // Read now, while the window certainly hasn't closed: IgniteView crashes reading a closed window's title.
            var title = window.Title;

            void Track()
            {
                // The one that's showing with that title and not yet tracked; the window it replaces,
                // if any, is still tracked until it closes. (Its title only changes later, through
                // the main thread, to the song that's playing.)
                foreach (var nsWindow in MacTitleBar.WindowsTitled(title))
                {
                    if (!MainWindows.ContainsKey(nsWindow) && ObjC.SendBool(nsWindow, "isVisible")) MainWindows[nsWindow] = window;
                }

                EnterForeground();
            }

            if (MainThread.IsCurrent) Track();
            else MainThread.Post(Track);
        }

        /// <summary>Whether this NSWindow is the main window's (until it closes). Main thread only.</summary>
        internal static bool IsMainWindow(IntPtr nsWindow) =>
            MainWindows.TryGetValue(nsWindow, out var window) && ReferenceEquals(window, Program.MainWindow);

        /// <summary>Brings the main window to the front, opening it again if it was closed. From any thread.</summary>
        public static void ShowMainWindow()
        {
            if (!MainThread.IsCurrent)
            {
                MainThread.Post(ShowMainWindow);
                return;
            }

            // Back in the Dock first, so the window opens as a regular app's.
            EnterForeground();

            var mainWindow = Program.MainWindow;
            var nsWindow = MainWindows.FirstOrDefault((entry) => ReferenceEquals(entry.Value, mainWindow)).Key;

            if (mainWindow == null || nsWindow == IntPtr.Zero)
            {
                Program.CreateMainWindow();
            }
            else
            {
                if (ObjC.SendBool(nsWindow, "isMiniaturized")) ObjC.Send(nsWindow, "deminiaturize:", IntPtr.Zero);
                ObjC.Send(nsWindow, "makeKeyAndOrderFront:", IntPtr.Zero);
            }

            // Not the cooperative activate: having closed the window, FocalSonic gave way to another
            // app, which wouldn't give way back, leaving the window behind it (or in Stage Manager's strip).
            ObjC.Send(Application, "activateIgnoringOtherApps:", 1);
        }

        /// <summary>A regular app again, in the Dock, now that there's a window.</summary>
        static void EnterForeground()
        {
            if (!InBackground) return;
            InBackground = false;

            ObjC.Send(Application, "setActivationPolicy:", RegularPolicy);
            MacStatusItem.Hide();
        }

        /// <summary>
        /// Without a window FocalSonic leaves the Dock and the app switcher (and Stage Manager,
        /// which would otherwise keep an empty entry for it), and waits in the menu bar.
        /// </summary>
        static void EnterBackground()
        {
            if (InBackground) return;
            InBackground = true;

            MacStatusItem.Show();
            ObjC.Send(Application, "setActivationPolicy:", AccessoryPolicy);
        }

        [UnmanagedCallersOnly]
        static void WindowWillClose(IntPtr self, IntPtr selector, IntPtr notification)
        {
            try
            {
                if (!MainWindows.Remove(ObjC.Send(notification, "object"), out var window)) return;

                // IgniteView is tearing the window down; carry on once it's done. (The NSWindow is
                // gone by then, so don't touch it.)
                MainThread.Post(() =>
                {
                    // Closed by the user (its close button) rather than by the app, which leaves IgniteView
                    // still listing it: let go of it the way the app's own close does.
                    if (ReferenceEquals(Program.MainWindow, window)) Program.CleanUpUI();

                    // Unless it was replaced by a new one, as a respawn does.
                    if (Program.MainWindow == null) EnterBackground();
                });
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine("Couldn't handle the window closing: " + ex);
            }
        }

        [UnmanagedCallersOnly]
        static byte ShouldTerminateAfterLastWindowClosed(IntPtr self, IntPtr selector, IntPtr application) => 0;

        [UnmanagedCallersOnly]
        static byte ShouldHandleReopen(IntPtr self, IntPtr selector, IntPtr application, byte hasVisibleWindows)
        {
            if (hasVisibleWindows != 0) return 1;

            try
            {
                ShowMainWindow(); // Including un-minimising it.
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine("Couldn't reopen the main window: " + ex);
            }
            return 0;
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
                var application = Application;
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
