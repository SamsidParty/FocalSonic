#if WINDOWS

using IgniteView.Core;
using System;
using System.Collections.Generic;
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

            SetWindowPos(
                ctx.NativeHandle,
                HWND_NOTOPMOST,
                300, 100,
                Program.DefaultBounds.InitialWidth, Program.DefaultBounds.InitialHeight,
                SWP_FRAMECHANGED | SWP_NOZORDER);
        }

        [Command("enterFullScreen")]
        public static void EnterFullScreen(WebWindow ctx)
        {
            ExitMiniPlayer(ctx);
            if (ctx == null || IsFullScreen) return;
            IsFullScreen = true;

            PreviousBounds = ctx.Bounds;

            ctx.Bounds = new WindowBounds()
            {
                MinHeight = 1,
                MinWidth = 1,
                MaxHeight = 9999,
                MaxWidth = 9999
            };

            OriginalStyle = (long)GetWindowLongPtr(ctx.NativeHandle, GWL_STYLE);

            int screenWidth = GetSystemMetrics(SM_CXSCREEN);
            int screenHeight = GetSystemMetrics(SM_CYSCREEN);

            SetWindowLongPtr(ctx.NativeHandle, GWL_STYLE, new IntPtr(WS_POPUP | WS_VISIBLE));

            SetWindowPos(
                ctx.NativeHandle,
                HWND_TOP,
                0, 0,
                screenWidth,
                screenHeight,
                SWP_FRAMECHANGED | SWP_NOZORDER);
        }

        [Command("exitFullScreen")]
        public static void ExitFullScreen(WebWindow ctx)
        {
            if (ctx == null || !IsFullScreen) return;
            IsFullScreen = false;

            SetWindowLongPtr(ctx.NativeHandle, GWL_STYLE, new IntPtr(OriginalStyle));


            SetWindowPos(
                ctx.NativeHandle,
                HWND_NOTOPMOST,
                300, 100,
                Program.DefaultBounds.InitialWidth, Program.DefaultBounds.InitialHeight,
                SWP_FRAMECHANGED | SWP_NOZORDER);

            ctx.Bounds = PreviousBounds ?? Program.DefaultBounds;
        }
    }
}

#endif