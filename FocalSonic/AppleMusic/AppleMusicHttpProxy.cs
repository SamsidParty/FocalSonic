using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using WatsonWebserver.Core;

namespace FocalSonic.AppleMusic
{
    public class AppleMusicHttpProxy
    {
        public static async Task AppleMusicHttpProxyRoute(HttpContextBase ctx)
        {
            if (ctx.Request.Url != null)
            {
                // The uri will be in the format /applemusic?me/etc
                var response = await AppleMusicHttpClient.SendRequest<string>(HttpUtility.UrlDecode(ctx.Request.Query.Querystring));

                ctx.Response.StatusCode = response != null ? 200 : 404;
                ctx.Response.ContentType = "application/json";
                await ctx.Response.Send(response ?? "{}");
                return;
            }

            ctx.Response.StatusCode = 500;
        }
    }
}
