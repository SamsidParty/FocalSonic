using Sharpcaster.Channels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FocalSonic.Casting
{
    public class FocalSonicChannel : ChromecastChannel
    {
        public FocalSonicChannel() : base(Casting.Namespace, null)
        {
        }

        public override void OnMessageReceived(string messagePayload, string type)
        {
            base.OnMessageReceived(messagePayload, type);
        }
    }
}
