using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SamsidParty.Subsonic.Proxy.AppleMusic.Controllers
{
    public class RequestForwardController : ControllerBase
    {
        [HttpGet("rest/applemusic/{*url}")]
        public async Task<IActionResult> ForwardRequestToApple(string url)
        {
            var response = await AppleMusicHttpClient.SendRequest<string>(url + Request.QueryString);
            Response.ContentLength = response.Length;
            return Content(response, "application/json");
        }
    }
}
