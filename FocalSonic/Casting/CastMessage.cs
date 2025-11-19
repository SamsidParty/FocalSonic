using GoogleCast.Models.Media;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FocalSonic.Casting
{
    public class CastMessage
    {

        [JsonProperty("type")]  public string Type;
        [JsonProperty("data")] public string[] Data;

        public CastMessage(string type, params string[] data)
        {
            this.Type = type;
            this.Data = data;
        }

        public MediaInformation ToVirtualLoadMessage()
        {
            return new MediaInformation()
            {
                ContentType = "focalsonic/virtual-cast-message",
                ContentId = JsonConvert.SerializeObject(this),
            };
        }
    }
}
