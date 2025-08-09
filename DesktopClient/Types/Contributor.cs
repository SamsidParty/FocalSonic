using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Aonsoku.Types
{
    public struct Contributor
    {
        [JsonProperty("role")]
        public string Role;

        [JsonProperty("artist")]
        public FeaturedArtist Artist;
    }
}
