using FocalSonic.AppleMusic;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using WatsonWebserver.Core;

namespace FocalSonic.Streaming
{
    public class StreamingProxy
    {
        public static HttpClient StreamingClient = new HttpClient();

        public static Dictionary<WatsonWebserver.Core.HttpMethod, System.Net.Http.HttpMethod> MethodMapping = new()
        {
            { WatsonWebserver.Core.HttpMethod.GET, System.Net.Http.HttpMethod.Get },
            { WatsonWebserver.Core.HttpMethod.POST, System.Net.Http.HttpMethod.Post },
            { WatsonWebserver.Core.HttpMethod.DELETE, System.Net.Http.HttpMethod.Delete },
            { WatsonWebserver.Core.HttpMethod.PATCH, System.Net.Http.HttpMethod.Patch },
            { WatsonWebserver.Core.HttpMethod.PUT, System.Net.Http.HttpMethod.Put },
        };

        public static async Task StreamingProxyRoute(HttpContextBase ctx)
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
                // The uri will be in the format /streaming?http://example.com/stream
                var url = HttpUtility.UrlDecode(ctx.Request.Query.Querystring);
                var message = new HttpRequestMessage(MethodMapping[ctx.Request.Method], url);
                Debug.WriteLine($"[StreamingProxy] Forwarding {ctx.Request.Method} request to {url}");

                foreach (var rHeader in ctx.Request.Headers.Keys)
                {
                    if (rHeader.ToString()!.ToLower() == "host") continue;
                    message.Headers.TryAddWithoutValidation(rHeader.ToString()!, ctx.Request.Headers.GetValues(rHeader.ToString())!.First());
                }

                if ((ctx.Request.Method == WatsonWebserver.Core.HttpMethod.POST) && ctx.Request.ContentLength > 0)
                {
                    var body = ctx.Request.DataAsBytes;
                    message.Content = new ByteArrayContent(body);
                }

                var request = await StreamingClient.SendAsync(message);
                var content = await request.Content.ReadAsByteArrayAsync();

                var streamingType = "default";
                if (ctx.Request.Url.ToString()!.Contains("atmos-v1")) streamingType = "atmos-v1";

                if (StreamingCDM.ShouldDecryptStream(streamingType) && content.Length > 0)
                {
                    var key = StreamingCDM.GetDecryptionKey(streamingType);
                    content = await StreamingCDM.DecryptStream(content, key);
                }

                ctx.Response.StatusCode = (int)request.StatusCode;
                
                foreach (var header in request.Headers)
                {
                    ctx.Response.Headers.Add(header.Key, string.Join(", ", header.Value));
                }
                foreach (var header in request.Content.Headers)
                {
                    ctx.Response.Headers.Add(header.Key, string.Join(", ", header.Value));
                }

                await ctx.Response.Send(content);
                return;
            }

            ctx.Response.StatusCode = 201; // No content
        }
    }
}
