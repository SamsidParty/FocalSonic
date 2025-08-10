using Microsoft.AspNetCore.Mvc;
using SamsidParty.Subsonic.Common;
using System.Runtime.InteropServices;

namespace SamsidParty.Subsonic.Proxy.AppleMusic.Controllers
{
    public partial class AppleMusicRequestImplementation : Subsonic.Common.IController
    {
        public async Task<FileResult> GetCoverArtAsync(string id, int? size)
        {
            if (size <= 0)
            {
                size = 512;
            }
            var url = id.Replace("{w}", size.ToString()).Replace("{h}", size.ToString());

            var request = await AppleMusicHttpClient.Instance.SendAsync(new HttpRequestMessage(HttpMethod.Get, url).WithMusicKitHeaders());
            return new FileStreamResult(await request.Content.ReadAsStreamAsync(), request.Content.Headers.ContentType?.MediaType ?? "image/jpeg");
        }
    }
}
