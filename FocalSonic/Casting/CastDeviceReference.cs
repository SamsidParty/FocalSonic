using GoogleCast;
using Newtonsoft.Json;
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
        public IReceiver Receiver;

        public string Name;
        public string DeviceUri;
        public string ReferenceID;

        public static CastDeviceReference Get(IReceiver recv)
        {
            var referenceID = recv.IPEndPoint.ToString() + "_" + recv.FriendlyName;

            if (!DiscoveredDevices.ContainsKey(referenceID))
            {
                DiscoveredDevices[referenceID] = new CastDeviceReference()
                {
                    Receiver = recv,
                    Name = recv.FriendlyName,
                    DeviceUri = recv.IPEndPoint.ToString(),
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
