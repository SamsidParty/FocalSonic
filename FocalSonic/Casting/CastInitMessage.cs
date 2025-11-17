using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FocalSonic.Casting
{
    public class CastInitMessage
    {
        [JsonProperty("credentials")]
        public string Credentials;

        public CastInitMessage(string credentials)
        {
            Credentials = credentials;
        }
    }
}
