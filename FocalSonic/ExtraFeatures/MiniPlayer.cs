using IgniteView.Core;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FocalSonic
{
    public class MiniPlayer
    {
        public static bool IsMiniPlayer = false;
        public static WindowBounds? PreviousBounds = null;

        [Command("enterMiniPlayer")]
        public static void EnterMiniPlayer(WebWindow ctx)
        {
            if (ctx == null || IsMiniPlayer) return;
            IsMiniPlayer = true;

            // Prevent overwriting previous bounds with the mini player bounds
            if (ctx.Bounds.MaxWidth != 715)
            {
                PreviousBounds = ctx.Bounds;
            }

            ctx.Bounds = new LockedWindowBounds(715, 455);
        }

        [Command("exitMiniPlayer")]
        public static void ExitMiniPlayer(WebWindow ctx)
        {
            if (ctx == null || !IsMiniPlayer) return;
            IsMiniPlayer = false;
            ctx.Bounds = PreviousBounds ?? Program.DefaultBounds;
        }
    }
}
