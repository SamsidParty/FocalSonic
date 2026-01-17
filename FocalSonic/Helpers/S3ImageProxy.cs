using FocalSonic.OverrideSystem;
using FocalSonic.Streaming;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using WatsonWebserver.Core;

namespace FocalSonic.Helpers
{
    public class S3ImageProxy
    {
        public static async Task S3ImageProxyRoute(HttpContextBase ctx)
        {
            // CORS
            if (!ctx.Request.HeaderExists("Origin") || ctx.Request.RetrieveHeaderValue("Origin") == "127.0.0.1" || ctx.Request.RetrieveHeaderValue("Origin") == "localhost")
            {
                ctx.Response.Headers.Add("Access-Control-Allow-Origin", "*");
                ctx.Response.Headers.Add("Access-Control-Allow-Headers", "*");
            }

            // The uri will be in the format /s3imageproxy?https://store-033.blobstore.apple.com/etc
            var awsImageURL = HttpUtility.UrlDecode(ctx.Request.Query.Querystring);
            var imageCacheDirectory = Path.Join(OverrideManager.OverridesDirectory, "S3CachedImages");


            try
            {
                if (string.IsNullOrWhiteSpace(awsImageURL))
                {
                    ctx.Response.StatusCode = 400;
                    await ctx.Response.Send("Missing presigned image URL in querystring.");
                    return;
                }

                if (!Uri.TryCreate(awsImageURL, UriKind.Absolute, out Uri awsUri))
                {
                    ctx.Response.StatusCode = 400;
                    await ctx.Response.Send("Invalid image URL.");
                    return;
                }

                // Normalize to a stable cache key by stripping querystring (signature changes every request)
                // Example:
                // https://store-033.blobstore.apple.com/.../image?X-Amz-... => https://store-033.blobstore.apple.com/.../image
                string stableKey = $"{awsUri.Scheme}://{awsUri.Host}{awsUri.AbsolutePath}";

                // Hash stable key to build safe filenames
                string hashHex;
                using (var sha = System.Security.Cryptography.SHA256.Create())
                {
                    byte[] hash = sha.ComputeHash(System.Text.Encoding.UTF8.GetBytes(stableKey));
                    hashHex = Convert.ToHexString(hash).ToLowerInvariant();
                }

                Directory.CreateDirectory(imageCacheDirectory);

                // We store:
                // - bytes: <hash>.bin
                // - content-type: <hash>.ct
                string binPath = Path.Combine(imageCacheDirectory, $"{hashHex}.bin");
                string ctPath = Path.Combine(imageCacheDirectory, $"{hashHex}.ct");

                // Always allow browser caching *of our proxy response*
                // (this is stable because callers should request /s3imageproxy?<same stable URL>)
                ctx.Response.Headers["Cache-Control"] = "public, max-age=31536000, immutable";

                // Serve from cache if exists
                if (File.Exists(binPath) && new FileInfo(binPath).Length > 0)
                {
                    byte[] cachedBytes = await File.ReadAllBytesAsync(binPath);
                    string cachedContentType = "application/octet-stream";

                    if (File.Exists(ctPath))
                    {
                        string ct = (await File.ReadAllTextAsync(ctPath)).Trim();
                        if (!string.IsNullOrWhiteSpace(ct)) cachedContentType = ct;
                    }

                    ctx.Response.StatusCode = 200;
                    ctx.Response.Headers["Content-Type"] = cachedContentType;
                    await ctx.Response.Send(cachedBytes);
                    return;
                }

                // Fetch + cache
                using (var handler = new HttpClientHandler()
                {
                    AutomaticDecompression = System.Net.DecompressionMethods.GZip
                                            | System.Net.DecompressionMethods.Deflate
                                            | System.Net.DecompressionMethods.Brotli
                })
                using (var http = new HttpClient(handler))
                using (var req = new HttpRequestMessage(System.Net.Http.HttpMethod.Get, awsUri))
                using (var resp = await http.SendAsync(req, HttpCompletionOption.ResponseHeadersRead))
                {
                    if (!resp.IsSuccessStatusCode)
                    {
                        ctx.Response.StatusCode = (int)resp.StatusCode;
                        await ctx.Response.Send($"Upstream returned {(int)resp.StatusCode} {resp.ReasonPhrase}");
                        return;
                    }

                    byte[] bytes = await resp.Content.ReadAsByteArrayAsync();

                    if (bytes == null || bytes.Length == 0)
                    {
                        ctx.Response.StatusCode = 502;
                        await ctx.Response.Send("Upstream returned empty image.");
                        return;
                    }

                    string contentType = resp.Content.Headers?.ContentType?.MediaType;
                    if (string.IsNullOrWhiteSpace(contentType)) contentType = "application/octet-stream";

                    // Cache to disk (atomic-ish write to avoid partial files if multiple requests race)
                    string tmpBin = binPath + ".tmp";
                    string tmpCt = ctPath + ".tmp";

                    await File.WriteAllBytesAsync(tmpBin, bytes);
                    await File.WriteAllTextAsync(tmpCt, contentType);

                    if (File.Exists(binPath)) File.Delete(binPath);
                    if (File.Exists(ctPath)) File.Delete(ctPath);

                    File.Move(tmpBin, binPath);
                    File.Move(tmpCt, ctPath);

                    // Serve response
                    ctx.Response.StatusCode = 200;
                    ctx.Response.Headers["Content-Type"] = contentType;
                    await ctx.Response.Send(bytes);
                    return;
                }
            }
            catch (Exception ex)
            {
                ctx.Response.StatusCode = 500;
                await ctx.Response.Send("S3 proxy error: " + ex.Message);
                return;
            }
        }
    }
}
