using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace SamsidParty.Subsonic.Common
{
    public class SubsonicMiddleware
    {
        private readonly RequestDelegate _next;


        // TODO: Actually implement a user store, this is just a placeholder
        private readonly Dictionary<string, string> Users = new()
        {
            { "test", "test123" },
        };

        private readonly Dictionary<string, string> APIKeys = new()
        {
            { "APIKEY123", "test" },
        };

        public SubsonicMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Subsonic clients like to append ".view" to the end of the path, this will remove those
            if (context.Request.Path.Value?.EndsWith(".view") ?? false)
            {
                context.Request.Path = context.Request.Path.Value!.TrimEnd(".view".ToCharArray());
            }

            // CORS
            context.Response.Headers.AccessControlAllowOrigin = "*";

            // Try to authenticate the request
            var q = context.Request.Query;
            string u = q["u"];
            string p = q["p"];
            string t = q["t"];
            string s = q["s"];
            string apiKey = q["apiKey"];

            try
            {
                string authenticatedUser = null;

                if (!string.IsNullOrEmpty(apiKey) && string.IsNullOrEmpty(u) && string.IsNullOrEmpty(p) && string.IsNullOrEmpty(t))
                {
                    authenticatedUser = ValidateApiKey(apiKey);
                }
                else if (!string.IsNullOrEmpty(t) && !string.IsNullOrEmpty(s) && !string.IsNullOrEmpty(u))
                {
                    authenticatedUser = ValidateToken(u, t, s);
                }
                else if (!string.IsNullOrEmpty(p) && !string.IsNullOrEmpty(u))
                {
                    authenticatedUser = ValidatePassword(u, p);
                }
                else
                {
                    throw new UnauthorizedAccessException("Missing authentication parameters");
                }

                if (authenticatedUser == null)
                    throw new UnauthorizedAccessException("Authentication failed");

                // Allow controllers to tell what user is authenticated
                context.Items["SubsonicUser"] = authenticatedUser;

                await _next(context);
            }
            catch (UnauthorizedAccessException ex)
            {
                context.Response.StatusCode = 200; // For some reason subsonic loves returning 200 even on error, so we do the same
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(JsonConvert.SerializeObject(
                    new SubsonicFailureResponse {
                        Status = SubsonicFailureResponseStatus.Failed,
                        Version = "1.16.1",
                        Type = "SamsidParty Subsonic",
                        ServerVersion = $"{RuntimeInformation.FrameworkDescription}",
                        OpenSubsonic = true,
                        Error = new SubsonicError
                        {
                            Code = SubsonicErrorCode._40, // Unauthorized
                            Message = "Authentication failed",
                        }
                    }
                ));
            }
        }


        private string ValidateApiKey(string apiKey)
        {
            return APIKeys.TryGetValue(apiKey, out var user) ? user : null;
        }

        private string ValidateToken(string username, string token, string salt)
        {
            if (!Users.TryGetValue(username, out var password))
                return null;

            // Spec: token = MD5(password + salt)
            using var md5 = MD5.Create();
            string expectedToken = GetMd5Hex(password + salt);

            return string.Equals(expectedToken, token, StringComparison.OrdinalIgnoreCase) ? username : null;
        }

        private string ValidatePassword(string username, string plainOrEnc)
        {
            if (!Users.TryGetValue(username, out var storedPassword))
                return null;

            if (plainOrEnc.StartsWith("enc:", StringComparison.OrdinalIgnoreCase))
            {
                string md5Hex = plainOrEnc.Substring(4);
                string expected = GetMd5Hex(storedPassword);
                return string.Equals(expected, md5Hex, StringComparison.OrdinalIgnoreCase) ? username : null;
            }
            else
            {
                return storedPassword == plainOrEnc ? username : null;
            }
        }

        private static string GetMd5Hex(string input)
        {
            using var md5 = MD5.Create();
            byte[] hash = md5.ComputeHash(Encoding.UTF8.GetBytes(input));
            return BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();
        }
    }

}
