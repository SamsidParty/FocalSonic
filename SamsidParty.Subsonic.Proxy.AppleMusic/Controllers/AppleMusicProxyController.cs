using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SamsidParty.Subsonic.Common;

namespace SamsidParty.Subsonic.Proxy.AppleMusic.Controllers
{
    public class AppleMusicProxyController : Subsonic.Common.Controller
    {
        public AppleMusicProxyController(AppleMusicRequestImplementation i) : base(i) { }
    }
}
