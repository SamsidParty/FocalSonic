#if MACOS

using FocalSonic.Casting;
using FocalSonic.Helpers;
using IgniteView.Core;
using Newtonsoft.Json.Linq;
using System.Runtime.InteropServices;

namespace FocalSonic.MacOS
{
    /// <summary>
    /// AirPlay on macOS, without the Python module Windows and Linux use. FocalSonicHelper owns an
    /// AirPlay route of FocalSonic's own and plays FocalSonic's captured audio on it (see
    /// Sources/AirPlay in FocalSonic.MacHelper), so only FocalSonic goes to the speakers and the rest
    /// of the Mac stays on its output device. This shows Apple's AirPlay picker for that route.
    /// macOS doesn't let apps list AirPlay speakers themselves, so the cast menu has a single
    /// "AirPlay" entry that opens the picker, anchored to the cast button.
    /// </summary>
    public static class MacAirPlay
    {
        public const string DeviceID = "airplay_macos";
        const string ErrorTitle = "AirPlay";

        /// <summary>The picker on screen (retained here), and its delegate. Main thread only.</summary>
        static IntPtr Picker, PickerDelegate;

        /// <summary>The cast menu's entry for the picker.</summary>
        public static CastDeviceReference Device => CastDeviceReference.DiscoveredDevices.GetOrAdd(DeviceID, (id) => new CastDeviceReference
        {
            Name = "AirPlay",
            ReferenceID = id,
            Type = "airplay-picker",
            Icon = "airplay",
        });

        public static void Setup()
        {
            MacHelper.AirPlayChanged += OnAirPlayChanged;
        }

        static void OnAirPlayChanged(bool active, string[] speakers, string? error)
        {
            Console.WriteLine(active ? $"[AirPlay] Playing on {string.Join(", ", speakers)}" : "[AirPlay] Stopped");
            if (!string.IsNullOrEmpty(error)) ErrorHandler.DisplayError(ErrorTitle, error);

            Casting.Casting.NativeAirPlayChanged(active);
        }

        /// <summary>Opens Apple's AirPlay picker below the cast button (its rect in CSS pixels).</summary>
        [Command("showAirPlayPicker")]
        public static async Task<string> ShowPicker(double x, double y, double width, double height, WebWindow ctx)
        {
            if (Casting.Casting.GetCastDeviceType() == "chromecast") return "busy";

            string? contextID;
            try
            {
                var reply = await MacHelper.Instance.Send("airplayPrepare", new { hostPID = Environment.ProcessId });
                contextID = reply.Value<string>("contextID");
            }
            catch (MacHelperException ex)
            {
                ErrorHandler.DisplayError(ErrorTitle, ex.Message);
                return "failed";
            }
            if (string.IsNullOrEmpty(contextID)) return "failed";

            var window = ctx ?? Program.MainWindow;
            var anchor = new NSRect { X = x, Y = y, Width = width, Height = height };
            var shown = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
            MainThread.Post(() =>
            {
                try { shown.TrySetResult(Present(window, contextID, anchor)); }
                catch (Exception ex)
                {
                    Console.Error.WriteLine("[AirPlay] Couldn't show the picker: " + ex);
                    shown.TrySetResult(false);
                }
            });

            if (!await shown.Task)
            {
                ErrorHandler.DisplayError(ErrorTitle, "Couldn't open the AirPlay menu.");
                return "failed";
            }
            return "success";
        }

        /// <summary>Stops playing on AirPlay speakers (FocalSonic stopped casting).</summary>
        public static void Stop()
        {
            MacHelper.RunningInstance?.Post("airplayStop");
        }

        /// <summary>
        /// Puts an invisible AVRoutePickerView over the cast button, pointed at the helper's route,
        /// and presses it: the menu is Apple's own, attached to the window like any AirPlay button's.
        /// It's removed again once the menu closes, so it never takes the cast button's clicks.
        /// </summary>
        static bool Present(WebWindow? window, string contextID, NSRect anchor)
        {
            Dismiss();

            if (window == null || !NativeLibrary.TryLoad("/System/Library/Frameworks/AVKit.framework/AVKit", out _)) return false;
            var nsWindow = MacAppLifetime.NativeWindow(window);
            var webView = FindWebView(nsWindow == IntPtr.Zero ? IntPtr.Zero : ObjC.Send(nsWindow, "contentView"));
            var pickerClass = ObjC.Class("AVRoutePickerView");
            if (webView == IntPtr.Zero || pickerClass == IntPtr.Zero) return false;

            var picker = ObjC.Send(ObjC.Send(pickerClass, "alloc"), "init");
            if (!ObjC.RespondsTo(picker, "setOutputContextID:"))
            {
                ObjC.Send(picker, "release");
                return false;
            }

            // Routes the helper's context rather than an AVPlayer of this process.
            ObjC.Send(picker, "setOutputContextID:", ObjC.String(contextID));
            ObjC.Send(picker, "setRoutePickerButtonBordered:", 0);
            var clear = ObjC.Send(ObjC.Class("NSColor"), "clearColor");
            for (long state = 0; state <= 3; state++) // AVRoutePickerViewButtonState: normal, highlighted, active, active highlighted
            {
                ObjC.Send(picker, ObjC.Selector("setRoutePickerButtonColor:forState:"), clear, (IntPtr)state);
            }
            ObjC.Send(picker, "setDelegate:", GetDelegate());
            ObjC.Send(picker, ObjC.Selector("setFrame:"), ToWebViewRect(webView, anchor));
            ObjC.Send(webView, "addSubview:", picker);
            ObjC.Send(picker, "layoutSubtreeIfNeeded");
            Picker = picker;

            if (ObjC.SendBool(picker, "accessibilityPerformPress") || ClickButton(picker)) return true;

            Dismiss();
            return false;
        }

        static void Dismiss()
        {
            if (Picker == IntPtr.Zero) return;

            var picker = Picker;
            Picker = IntPtr.Zero;
            ObjC.Send(picker, "setDelegate:", IntPtr.Zero);
            ObjC.Send(picker, "removeFromSuperview");
            ObjC.Send(picker, "release");
        }

        /// <summary>If the picker doesn't take an accessibility press, click its button instead.</summary>
        static bool ClickButton(IntPtr view)
        {
            var buttonClass = ObjC.Class("NSButton");
            var subviews = ObjC.Send(view, "subviews");
            var count = ObjC.SendLong(subviews, ObjC.Selector("count"));

            for (long i = 0; i < count; i++)
            {
                var subview = ObjC.Send(subviews, "objectAtIndex:", i);
                if (ObjC.SendBool(subview, "isKindOfClass:", buttonClass))
                {
                    ObjC.Send(subview, "performClick:", IntPtr.Zero);
                    return true;
                }
                if (ClickButton(subview)) return true;
            }
            return false;
        }

        /// <summary>The window's web view: the frontend's coordinates are its own.</summary>
        static IntPtr FindWebView(IntPtr view)
        {
            var webViewClass = ObjC.Class("WKWebView");
            if (view == IntPtr.Zero || webViewClass == IntPtr.Zero) return IntPtr.Zero;
            if (ObjC.SendBool(view, "isKindOfClass:", webViewClass)) return view;

            var subviews = ObjC.Send(view, "subviews");
            var count = ObjC.SendLong(subviews, ObjC.Selector("count"));
            for (long i = 0; i < count; i++)
            {
                var found = FindWebView(ObjC.Send(subviews, "objectAtIndex:", i));
                if (found != IntPtr.Zero) return found;
            }
            return IntPtr.Zero;
        }

        /// <summary>A CSS pixel rect (from the top left of the page) in the web view's own coordinates.</summary>
        static NSRect ToWebViewRect(IntPtr webView, NSRect css)
        {
            var zoom = ObjC.RespondsTo(webView, "pageZoom") ? ObjC.SendDouble(webView, "pageZoom") : 1;
            if (zoom <= 0) zoom = 1;

            var rect = new NSRect { X = css.X * zoom, Y = css.Y * zoom, Width = css.Width * zoom, Height = css.Height * zoom };
            if (!ObjC.SendBool(webView, "isFlipped"))
            {
                rect.Y = ObjC.SendRect(webView, "bounds").Height - rect.Y - rect.Height;
            }
            return rect;
        }

        static unsafe IntPtr GetDelegate()
        {
            if (PickerDelegate != IntPtr.Zero) return PickerDelegate;

            PickerDelegate = ObjC.NewObject("FocalSonicRoutePickerDelegate");
            ObjC.Implement(PickerDelegate, "routePickerViewDidEndPresentingRoutes:",
                (IntPtr)(delegate* unmanaged<IntPtr, IntPtr, IntPtr, void>)&DidEndPresentingRoutes, "v@:@");
            return PickerDelegate;
        }

        [UnmanagedCallersOnly]
        static void DidEndPresentingRoutes(IntPtr self, IntPtr selector, IntPtr picker)
        {
            // Not from inside the picker's own callback.
            MainThread.Post(() =>
            {
                if (picker == Picker) Dismiss();
            });
        }
    }
}

#endif
