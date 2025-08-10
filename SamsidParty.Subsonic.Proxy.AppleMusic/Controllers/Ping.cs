using SamsidParty.Subsonic.Common;
using System;
using System.Reflection;
using System.Runtime.InteropServices;

namespace SamsidParty.Subsonic.Proxy.AppleMusic.Controllers
{
    public partial class AppleMusicRequestImplementation : Subsonic.Common.IController
    {
        public async Task<SubsonicResponse> PingAsync()
        {
            return new SubsonicResponse()
            {
                SubsonicResponse1 = GetDefaultResponse()
            };
        }

        public SubsonicSuccessResponse GetDefaultResponse()
        {
            return new SubsonicSuccessResponse()
            {
                Status = SubsonicSuccessResponseStatus.Ok,
                Version = "1.16.1",
                Type = "SamsidParty Subsonic",
                ServerVersion = $"{RuntimeInformation.FrameworkDescription}",
                OpenSubsonic = true,
            };
        }

        public SubsonicFailureResponse GetErrorResponse()
        {
            var defaultRes = GetDefaultResponse();
            return new SubsonicFailureResponse()
            {
                Status = SubsonicFailureResponseStatus.Failed,
                Version = defaultRes.Version,
                Type = defaultRes.Type,
                ServerVersion = defaultRes.Version,
                OpenSubsonic = true,
            };
        }
    }
}
