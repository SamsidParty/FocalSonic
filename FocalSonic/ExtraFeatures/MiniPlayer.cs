using IgniteView.Core;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;

namespace FocalSonic
{
    public class MiniPlayer
    {
        public static bool IsMiniPlayer = false;
        public static WindowBounds? PreviousBounds = null;

        #if WINDOWS
        const int SWP_NOMOVE = 0x0002;
        const int SWP_NOSIZE = 0x0001;
        const int HWND_TOPMOST = -1;
        const int GWL_EXSTYLE = -20;
        const int WS_EX_TOOLWINDOW = 0x00000080;

        [DllImport("user32.dll")]
        static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);


        [DllImport("user32.dll")]
        static extern int GetWindowLong(IntPtr hWnd, int nIndex);

        [DllImport("user32.dll")]
        static extern int SetWindowLong(IntPtr hWnd, int nIndex, int dwNewLong);
        #endif

        [Command("enterMiniPlayer")]
        public static void EnterMiniPlayer(WebWindow ctx)
        {
            if (ctx == null || IsMiniPlayer) return;
            IsMiniPlayer = true;

            // Prevent overwriting previous bounds with the mini player bounds
            if (ctx.Bounds.MaxWidth != 500)
            {
                PreviousBounds = ctx.Bounds;
            }

            ctx.Bounds = new LockedWindowBounds(500, 300);

            #if WINDOWS
            SetWindowPos(ctx.NativeHandle, (IntPtr)HWND_TOPMOST, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE);
            int exStyle = GetWindowLong(ctx.NativeHandle, GWL_EXSTYLE);
            SetWindowLong(ctx.NativeHandle, GWL_EXSTYLE, exStyle | WS_EX_TOOLWINDOW);
            #endif
        }

        [Command("exitMiniPlayer")]
        public static void ExitMiniPlayer(WebWindow ctx)
        {
            if (ctx == null || !IsMiniPlayer) return;
            IsMiniPlayer = false;
            ctx.Bounds = PreviousBounds ?? Program.DefaultBounds;

            #if WINDOWS
            SetWindowPos(ctx.NativeHandle, -2, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE);
            int exStyle = GetWindowLong(ctx.NativeHandle, GWL_EXSTYLE);
            SetWindowLong(ctx.NativeHandle, GWL_EXSTYLE, exStyle & ~WS_EX_TOOLWINDOW);
            #endif
        }
    }
}
