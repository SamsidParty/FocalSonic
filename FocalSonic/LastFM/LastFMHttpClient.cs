using FocalSonic.AppleMusic;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace FocalSonic.LastFM
{
    public class LastFMHttpClient : HttpClient
    {
        public static LastFMHttpClient Instance = new LastFMHttpClient();

        public LastFMHttpClient()
        {
            this.BaseAddress = new Uri("https://ws.audioscrobbler.com/2.0/");
        }
    }
}
