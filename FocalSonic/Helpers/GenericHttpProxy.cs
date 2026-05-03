using System;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;
using WatsonWebserver.Core;

namespace FocalSonic.Helpers
{
    public class GenericHttpProxy
    {
        private static readonly HttpClient Client = new HttpClient(new HttpClientHandler
        {
            AutomaticDecompression = System.Net.DecompressionMethods.GZip
                                   | System.Net.DecompressionMethods.Deflate
                                   | System.Net.DecompressionMethods.Brotli
        });

        public static async Task GenericHttpProxyRoute(HttpContextBase ctx)
        {
            ctx.Response.Headers.Add("Access-Control-Allow-Origin", "*");
            ctx.Response.Headers.Add("Access-Control-Allow-Headers", "*");

            var targetUrl = HttpUtility.UrlDecode(ctx.Request.Query.Querystring);

            if (string.IsNullOrWhiteSpace(targetUrl) || !Uri.TryCreate(targetUrl, UriKind.Absolute, out _))
            {
                ctx.Response.StatusCode = 400;
                await ctx.Response.Send("Missing or invalid URL in querystring.");
                return;
            }

            try
            {
                using var request = new HttpRequestMessage(System.Net.Http.HttpMethod.Get, targetUrl);
                using var response = await Client.SendAsync(request);
                var content = await response.Content.ReadAsStringAsync();

                ctx.Response.StatusCode = (int)response.StatusCode;
                ctx.Response.ContentType = response.Content.Headers?.ContentType?.MediaType ?? "application/json";
                await ctx.Response.Send(content);
            }
            catch (Exception ex)
            {
                ctx.Response.StatusCode = 502;
                await ctx.Response.Send("Proxy error: " + ex.Message);
            }
        }
    }
}
