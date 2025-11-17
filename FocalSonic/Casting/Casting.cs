using FocalSonic.AppleMusic;
using IgniteView.Core;
using Newtonsoft.Json;
using SamsidParty.Subsonic.Common;
using Sharpcaster;
using Sharpcaster.Channels;
using Sharpcaster.Models.Media;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Windows.Media.Protection.PlayReady;

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

            await Client.ConnectChromecast(chromecast);
            await Client.LaunchApplicationAsync("D0792F6F", false);

            var media = new Media()
            {
                ContentId = "1679278167",
                ContentType = "applemusic",
                CustomData = JsonConvert.SerializeObject(new CastInitMessage(AppleMusicKeys.MediaUserToken!))
            };


            var mediaStatus = await Client.MediaChannel.LoadAsync(media);

            var appleMusicChannel = Client;
        }
    }
}
