using GoogleCast;
using GoogleCast.Channels;
using GoogleCast.Messages;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FocalSonic.Casting
{
    public class FocalSonicChannel : IApplicationChannel
    {

        public string ApplicationId => "D0792F6F";

        public ISender? Sender { get; set; }

        public string Namespace => "urn:x-cast:com.samsidparty.focalsonic";

        public async Task OnMessageReceivedAsync(IMessage message)
        {
            Console.WriteLine(message.Type);
        }
    }
}
