using FocalSonic.AppleMusic;
using IgniteView.Core;
using Newtonsoft.Json;
using Sharpcaster;
using Sharpcaster.Channels;
using Sharpcaster.Models.Media;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FocalSonic.Casting
{

    public class Casting
    {
        public const string Namespace = "urn:x-cast:com.samsidparty.focalsonic";

        static ChromecastLocator _Locator;
        static ChromecastLocator Locator
        {
            get
            {
                if (_Locator == null)
                {
                    _Locator = new ChromecastLocator();
                }
                return _Locator;
            }
        }

        static ChromecastClient Client;


        [Command("chromeCast")]
        public static async Task GetCastDevices()
        {

            var chromecasts = await Locator.FindReceiversAsync((TimeSpan.FromSeconds(5)));

            if (!chromecasts.Any())
            {
                Console.WriteLine("No Chromecast devices found");
                return;
            }

            // Connect to first found samsung device (testing)
            var chromecast = chromecasts.Where((d) => d.Name.Contains("SM")).First();

            Client = new ChromecastClient();

            var channelToForceAdd = new FocalSonicChannel();
            var newChannelList = Client.Channels.ToList();
            newChannelList.Add(channelToForceAdd);
            Client.Channels = newChannelList;

            await Client.ConnectChromecast(chromecast);
            await Client.LaunchApplicationAsync("D0792F6F", false);



            await Client.SendAsync(null, Namespace, JsonConvert.SerializeObject(new CastInitMessage("applemusic", AppleMusicKeys.MediaUserToken)), "receiver-0");

            var appleMusicChannel = Client;
        }
    }
}
