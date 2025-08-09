using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Aonsoku.Types
{
    public struct FeaturedArtist
    {
        [JsonProperty("id")]
        public string ID;

        [JsonProperty("name")]
        public string Name;
    }
}
