using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Sharpcaster.Channels;
using System;
using System.Collections.Generic;
using System.Dynamic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FocalSonic.Casting
{
    public class AppleMusicCastChannel : ChromecastChannel
    {
        public AppleMusicCastChannel()
            : base("urn:x-cast:applemusic", null) { }



        public override void OnMessageReceived(string message, string messageType)
        {
            var data = JsonConvert.DeserializeObject<ExpandoObject>(message);
        }
    }
}
