#if WINDOWS

using IgniteView.Core;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Forms;

namespace FocalSonic.Windows
{
    public class WindowManagement
    {
        public static bool IsMiniPlayer = false;
        public static bool IsFullScreen = false;
        public static WindowBounds? PreviousBounds = null;

        private const int GWL_STYLE = -16;
        private const int GWL_EXSTYLE = -20;

        const int SWP_NOMOVE = 0x0002;
        const int SWP_NOSIZE = 0x0001;
        const int WS_EX_TOOLWINDOW = 0x00000080;

        // Window Styles
        private const uint WS_OVERLAPPEDWINDOW = 0x00000000 | 0x00080000 | 0x00C00000 | 0x00040000 | 0x00020000 | 0x00010000; // Default style
        private const uint WS_POPUP = 0x80000000; // Borderless style (no title bar or border)
        private const uint WS_VISIBLE = 0x10000000;

        // SetWindowPos flags
        private const uint SWP_NOZORDER = 0x0004;
        private const uint SWP_FRAMECHANGED = 0x0020;
        private const int SM_CXSCREEN = 0;
        private const int SM_CYSCREEN = 1;
        private static IntPtr HWND_TOP = new IntPtr(0);
        private static IntPtr HWND_TOPMOST = new IntPtr(-1);
        private static IntPtr HWND_NOTOPMOST = new IntPtr(-2);

        static long OriginalStyle;

        // Track which monitor fullscreen was entered on (so exit restores to same monitor)
        private static Screen? _fullScreenScreen;

        [DllImport("user32.dll")]
        static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);


        [DllImport("user32.dll")]
        static extern int GetWindowLong(IntPtr hWnd, int nIndex);

        [DllImport("user32.dll")]
        static extern int SetWindowLong(IntPtr hWnd, int nIndex, int dwNewLong);

        [DllImport("user32.dll")]
        public static extern IntPtr SetWindowLongPtr(IntPtr hWnd, int nIndex, IntPtr dwNewLong);

        [DllImport("user32.dll")]
        public static extern IntPtr GetWindowLongPtr(IntPtr hWnd, int nIndex);


        [DllImport("user32.dll")]
        public static extern int GetSystemMetrics(int nIndex);


        private static Screen GetScreenForWindow(IntPtr hwnd)
            => Screen.FromHandle(hwnd);

        private static (int X, int Y) GetCenteredClampedPosition(Screen screen, int width, int height)
        {
            Rectangle wa = screen.WorkingArea;

            if (width <= 0) width = 1;
            if (height <= 0) height = 1;

            // center in working area
            int x = wa.Left + Math.Max(0, (wa.Width - width) / 2);
            int y = wa.Top + Math.Max(0, (wa.Height - height) / 2);

            // clamp into working area (handles negative coordinates / oversized windows)
            int maxX = wa.Right - Math.Min(width, wa.Width);
            int maxY = wa.Bottom - Math.Min(height, wa.Height);

            x = Math.Min(Math.Max(x, wa.Left), maxX);
            y = Math.Min(Math.Max(y, wa.Top), maxY);

            return (x, y);
        }

        [Command("enterMiniPlayer")]
        public static void EnterMiniPlayer(WebWindow ctx)
        {
            ExitFullScreen(ctx);
            if (ctx == null || IsMiniPlayer) return;
            IsMiniPlayer = true;

            // Prevent overwriting previous bounds with the mini player bounds
            if (ctx.Bounds.MaxWidth != 700)
            {
                PreviousBounds = ctx.Bounds;
            }

            ctx.Bounds = new WindowBounds(550, 300)
            {
                MaxHeight = 0,
                MaxWidth = 0,
                MinHeight = 0,
                MinWidth = 0
            };

            ctx.Bounds = new WindowBounds(550, 300)
            {
                MaxHeight = 400,
                MaxWidth = 700,
                MinHeight = 300,
                MinWidth = 300
            };

            SetWindowPos(ctx.NativeHandle, HWND_TOPMOST, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE);
            int exStyle = GetWindowLong(ctx.NativeHandle, GWL_EXSTYLE);
            SetWindowLong(ctx.NativeHandle, GWL_EXSTYLE, exStyle | WS_EX_TOOLWINDOW);
        }

        [Command("exitMiniPlayer")]
        public static void ExitMiniPlayer(WebWindow ctx)
        {
            if (ctx == null || !IsMiniPlayer) return;
            IsMiniPlayer = false;

            SetWindowPos(ctx.NativeHandle, HWND_NOTOPMOST, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE);
            int exStyle = GetWindowLong(ctx.NativeHandle, GWL_EXSTYLE);
            SetWindowLong(ctx.NativeHandle, GWL_EXSTYLE, exStyle & ~WS_EX_TOOLWINDOW);

            ctx.Bounds = Program.DefaultBounds;

            // Restore on the monitor the window is currently on (not a hardcoded primary-monitor position)
            var screen = GetScreenForWindow(ctx.NativeHandle);
            int w = Program.DefaultBounds.InitialWidth;
            int h = Program.DefaultBounds.InitialHeight;
            var (x, y) = GetCenteredClampedPosition(screen, w, h);

            SetWindowPos(
                ctx.NativeHandle,
                HWND_NOTOPMOST,
                x, y,
                w, h,
                SWP_FRAMECHANGED | SWP_NOZORDER);
        }

        [Command("enterFullScreen")]
        public static void EnterFullScreen(WebWindow ctx)
        {
            ExitMiniPlayer(ctx);
            if (ctx == null || IsFullScreen) return;
            IsFullScreen = true;

            PreviousBounds = ctx.Bounds;

            // Capture the monitor we're entering fullscreen on
            _fullScreenScreen = GetScreenForWindow(ctx.NativeHandle);

            ctx.Bounds = new WindowBounds()
            {
                MinHeight = 1,
                MinWidth = 1,
                MaxHeight = 9999,
                MaxWidth = 9999
            };

            OriginalStyle = (long)GetWindowLongPtr(ctx.NativeHandle, GWL_STYLE);

            // Use the monitor bounds (not primary screen metrics)
            Rectangle b = _fullScreenScreen.Bounds;

            SetWindowLongPtr(ctx.NativeHandle, GWL_STYLE, new IntPtr(WS_POPUP | WS_VISIBLE));

            SetWindowPos(
                ctx.NativeHandle,
                HWND_TOP,
                b.Left, b.Top,
                b.Width, b.Height,
                SWP_FRAMECHANGED | SWP_NOZORDER);
        }

        [Command("exitFullScreen")]
        public static void ExitFullScreen(WebWindow ctx)
        {
            if (ctx == null || !IsFullScreen) return;
            IsFullScreen = false;

            SetWindowLongPtr(ctx.NativeHandle, GWL_STYLE, new IntPtr(OriginalStyle));

            // Restore bounds first
            var restoreBounds = PreviousBounds ?? Program.DefaultBounds;
            ctx.Bounds = restoreBounds;

            // Restore onto the same monitor we entered fullscreen on
            var targetScreen = _fullScreenScreen ?? GetScreenForWindow(ctx.NativeHandle);

            int w = restoreBounds.InitialWidth;
            int h = restoreBounds.InitialHeight;
            var (x, y) = GetCenteredClampedPosition(targetScreen, w, h);

            SetWindowPos(
                ctx.NativeHandle,
                HWND_NOTOPMOST,
                x, y,
                w, h,
                SWP_FRAMECHANGED | SWP_NOZORDER);
        }
    }
}

#endif