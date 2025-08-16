using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Security.Policy;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using WatsonWebserver.Core;

namespace FocalSonic.AppleMusic
{
    public class AppleMusicHttpProxy
    {
        public static Dictionary<WatsonWebserver.Core.HttpMethod, System.Net.Http.HttpMethod> MethodMapping = new()
        {
            { WatsonWebserver.Core.HttpMethod.GET, System.Net.Http.HttpMethod.Get },
            { WatsonWebserver.Core.HttpMethod.POST, System.Net.Http.HttpMethod.Post },
            { WatsonWebserver.Core.HttpMethod.DELETE, System.Net.Http.HttpMethod.Delete },
            { WatsonWebserver.Core.HttpMethod.PATCH, System.Net.Http.HttpMethod.Patch },
            { WatsonWebserver.Core.HttpMethod.PUT, System.Net.Http.HttpMethod.Put },
        };

        public static async Task AppleMusicHttpProxyRoute(HttpContextBase ctx)
        {
            // CORS
            if (!ctx.Request.HeaderExists("Origin") || ctx.Request.RetrieveHeaderValue("Origin") == "127.0.0.1" || ctx.Request.RetrieveHeaderValue("Origin") == "localhost")
            {
                ctx.Response.Headers.Add("Access-Control-Allow-Origin", "*");
                ctx.Response.Headers.Add("Access-Control-Allow-Headers", "*");
            }

            var shouldForward = (ctx.Request.Method != WatsonWebserver.Core.HttpMethod.OPTIONS && ctx.Request.Method != WatsonWebserver.Core.HttpMethod.HEAD);
            if (ctx.Request.Url != null && shouldForward)
            {
                // The uri will be in the format /applemusic?me/etc
                var url = HttpUtility.UrlDecode(ctx.Request.Query.Querystring);
                var message = new HttpRequestMessage(MethodMapping[ctx.Request.Method], url.Replace("{storefront}", AppleMusicKeys.Region));
                

                if (ctx.Request.Method == WatsonWebserver.Core.HttpMethod.POST || ctx.Request.Method == WatsonWebserver.Core.HttpMethod.PUT || ctx.Request.Method == WatsonWebserver.Core.HttpMethod.PATCH)
                {
                    var body = ctx.Request.DataAsString;
                    message.Content = new StringContent(body, Encoding.UTF8, "application/json");
                }

                var request = await AppleMusicHttpClient.Instance.SendAsync(message.WithMusicKitHeaders());
                var content = await request.Content.ReadAsStringAsync();

                ctx.Response.StatusCode = (int)request.StatusCode;
                ctx.Response.ContentType = "application/json";
                await ctx.Response.Send(content ?? "{}");
                return;
            }

            ctx.Response.StatusCode = 201; // No content
        }
    }
}
