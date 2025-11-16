using IgniteView.Core;
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
            var chromecast = chromecasts.Where((d) => d.Name.Contains("SM-")).First();

            Client = new ChromecastClient( );
            await Client.ConnectChromecast(chromecast);
            await Client.LaunchApplicationAsync("8A86881D");

            var media = new Media
            {
                ContentType = "loc",
                ContentUrl = "https://apps.mzstatic.com/content/chromecast-music-app"
            };
            var channel = Client.GetChannel<MediaChannel>();
            var status = await channel.LoadAsync(media);

            var appleMusicChannel = Client;
        }
    }
}
