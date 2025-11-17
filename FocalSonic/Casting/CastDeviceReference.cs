using Newtonsoft.Json;
using Sharpcaster.Models;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FocalSonic.Casting
{
    public class CastDeviceReference
    {
        public static ConcurrentDictionary<string, CastDeviceReference> DiscoveredDevices = new();

        [JsonIgnore]
        public ChromecastReceiver Receiver;

        public string Name;
        public string DeviceUri;
        public int Port;
        public string ReferenceID;

        public static CastDeviceReference Get(ChromecastReceiver recv)
        {
            var referenceID = recv.DeviceUri.ToString() + "_" + recv.Name + "_" + recv.Port;

            if (!DiscoveredDevices.ContainsKey(referenceID))
            {
                DiscoveredDevices[referenceID] = new CastDeviceReference()
                {
                    Receiver = recv,
                    Name = recv.Name,
                    DeviceUri = recv.DeviceUri.ToString(),
                    Port = recv.Port,
                    ReferenceID = referenceID
                };
            }

            return DiscoveredDevices[referenceID];
        }

        public static CastDeviceReference? GetByID(string referenceID)
        {
            if (DiscoveredDevices.ContainsKey(referenceID))
            {
                return DiscoveredDevices[referenceID];
            }
            return null;
        }
    }
}
