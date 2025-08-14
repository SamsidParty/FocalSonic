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
        private string _serverName = "samsidparty";


        // TODO: Actually implement a user store, this is just a placeholder
        private Func<Dictionary<string, string>> _userGetter;

        private Dictionary<string, string> APIKeys = new() { };

        public SubsonicMiddleware(RequestDelegate next, string serverName, Func<Dictionary<string, string>> userGetter)
        {
            _next = next;
            _serverName = serverName;
            _userGetter = userGetter;   
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

            await _next(context);
        }


        private string ValidateApiKey(string apiKey)
        {
            return APIKeys.TryGetValue(apiKey, out var user) ? user : null;
        }

        private string ValidateToken(string username, string token, string salt)
        {
            if (!_userGetter().TryGetValue(username, out var password))
                return null;

            // Spec: token = MD5(password + salt)
            using var md5 = MD5.Create();
            string expectedToken = GetMd5Hex(password + salt);

            return string.Equals(expectedToken, token, StringComparison.OrdinalIgnoreCase) ? username : null;
        }

        private string ValidatePassword(string username, string plainOrEnc)
        {
            if (!_userGetter().TryGetValue(username, out var storedPassword))
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
