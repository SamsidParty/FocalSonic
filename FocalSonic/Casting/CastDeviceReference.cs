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
    // A cast target — Chromecast or AirPlay, distinguished by Type. Both render from
    // the same device list / code paths on the frontend.
    public class CastDeviceReference
    {
        public static ConcurrentDictionary<string, CastDeviceReference> DiscoveredDevices = new();

        // Chromecast-specific handle (null for AirPlay devices).
        [JsonIgnore]
        public IReceiver Receiver;

        public string Name;
        public string DeviceUri;
        public string ReferenceID;
        public string Type = "chromecast";

        // AirPlay-specific fields (null/empty for Chromecast devices).
        [JsonIgnore]
        public string AirPlayAddress;
        [JsonIgnore]
        public string AirPlayIdentifier;

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
                    ReferenceID = referenceID,
                    Type = "chromecast"
                };
            }

            return DiscoveredDevices[referenceID];
        }

        // Registers (or refreshes) an AirPlay device discovered via Zeroconf.
        public static CastDeviceReference GetAirPlay(string name, string address, string identifier)
        {
            // Prefer the stable device identifier; fall back to the address.
            var referenceID = "airplay_" + (string.IsNullOrEmpty(identifier) ? address : identifier);

            var reference = DiscoveredDevices.GetValueOrDefault(referenceID) ?? new CastDeviceReference();
            reference.Name = name;
            reference.DeviceUri = address;
            reference.ReferenceID = referenceID;
            reference.Type = "airplay";
            reference.AirPlayAddress = address;
            reference.AirPlayIdentifier = identifier;

            DiscoveredDevices[referenceID] = reference;
            return reference;
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
