using Newtonsoft.Json;

namespace SamsidParty.Subsonic.Proxy.AppleMusic.Types
{
    public class EditorialNotes
    {
        [JsonProperty("short")]
        public string Short { get; set; }

        [JsonProperty("standard")]
        public string Standard { get; set; }
    }
}
