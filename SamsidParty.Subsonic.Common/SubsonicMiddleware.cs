using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SamsidParty.Subsonic.Common
{
    public class SubsonicMiddleware
    {
        private readonly RequestDelegate _next;

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


            await _next(context);
        }
    }

}
