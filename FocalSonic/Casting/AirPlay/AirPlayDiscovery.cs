using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.NetworkInformation;
using System.Threading.Tasks;
using Zeroconf;

namespace FocalSonic.Casting.AirPlay
{
    // Discovers AirPlay receivers via Bonjour/mDNS (Zeroconf, a GoogleCast transitive
    // dep). Done here in C# so scans are cheap; the module only launches on selection.
    public static class AirPlayDiscovery
    {
        // Carries the friendly name and TXT "deviceid" (what pyatv matches on).
        const string AirPlayServiceType = "_airplay._tcp.local.";

        public static async Task<List<CastDeviceReference>> ScanAsync(TimeSpan? scanTime = null)
        {
            var devices = new List<CastDeviceReference>();

            try
            {
                // Pass only IPv4-capable interfaces: letting Zeroconf enumerate all
                // adapters makes it throw NetworkInformationException on IPv4-less ones.
                var interfaces = GetViableInterfaces();
                if (interfaces.Count == 0) return devices;

                var hosts = await ZeroconfResolver.ResolveAsync(
                    AirPlayServiceType,
                    scanTime: scanTime ?? TimeSpan.FromSeconds(2),
                    netInterfacesToSendRequestOn: interfaces.ToArray());

                foreach (var host in hosts)
                {
                    var address = PickAddress(host);
                    if (string.IsNullOrEmpty(address)) continue;

                    var name = string.IsNullOrWhiteSpace(host.DisplayName) ? address : host.DisplayName;
                    var identifier = ExtractDeviceId(host);
                    var icon = ClassifyIcon(ExtractTxt(host, "model"));

                    devices.Add(CastDeviceReference.GetAirPlay(name, address, identifier, icon));
                }
            }
            catch
            {
                // mDNS errors should never break the device picker.
            }

            return devices;
        }

        // Up, non-loopback/tunnel, IPv4-configured interfaces.
        static List<NetworkInterface> GetViableInterfaces()
        {
            var result = new List<NetworkInterface>();

            try
            {
                foreach (var ni in NetworkInterface.GetAllNetworkInterfaces())
                {
                    try
                    {
                        if (ni.OperationalStatus != OperationalStatus.Up) continue;
                        if (ni.NetworkInterfaceType == NetworkInterfaceType.Loopback) continue;
                        if (ni.NetworkInterfaceType == NetworkInterfaceType.Tunnel) continue;
                        if (ni.IsReceiveOnly) continue;

                        // Supports() is the non-throwing IPv4 check (GetIPv4Properties throws).
                        if (!ni.Supports(NetworkInterfaceComponent.IPv4)) continue;

                        var props = ni.GetIPProperties();
                        var hasIPv4 = props.UnicastAddresses.Any(
                            a => a.Address.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork);
                        if (!hasIPv4) continue;

                        result.Add(ni);
                    }
                    catch
                    {
                        // Adapter without IPv4 / inaccessible properties — skip it.
                    }
                }
            }
            catch
            {
                // GetAllNetworkInterfaces itself failed — return whatever we have.
            }

            return result;
        }

        static string PickAddress(IZeroconfHost host)
        {
            // Prefer an IPv4 address; pyatv scans by host IP.
            var ipv4 = host.IPAddresses?.FirstOrDefault(a => a.Contains('.') && !a.Contains(':'));
            return ipv4 ?? host.IPAddress;
        }

        static string ExtractDeviceId(IZeroconfHost host) => ExtractTxt(host, "deviceid");

        // Pulls a TXT-record value (e.g. "deviceid", "model") from the host's services.
        static string ExtractTxt(IZeroconfHost host, string key)
        {
            foreach (var service in host.Services.Values)
            {
                foreach (var props in service.Properties)
                {
                    if (props.TryGetValue(key, out var value) && !string.IsNullOrEmpty(value))
                    {
                        return value;
                    }
                }
            }
            return "";
        }

        // Maps the AirPlay TXT "model" string to a frontend icon hint. Apple models look
        // like "AppleTV6,2", "AudioAccessory5,1" (HomePod), "Macmini9,1"/"MacBookPro18,1".
        // Falls back to "airplay" when the model is missing or unrecognized.
        static string ClassifyIcon(string model)
        {
            if (string.IsNullOrEmpty(model)) return "airplay";

            if (model.StartsWith("AppleTV", StringComparison.OrdinalIgnoreCase)) return "appletv";
            if (model.StartsWith("AudioAccessory", StringComparison.OrdinalIgnoreCase)) return "homepod";
            if (model.StartsWith("iMac", StringComparison.OrdinalIgnoreCase)) return "imac";

            // These two are confusing, my Macbook shows up as Mac17,2 instead of MacBook17,2
            if (model.StartsWith("MacMini", StringComparison.OrdinalIgnoreCase)) return "mac";
            if (model.StartsWith("Mac", StringComparison.OrdinalIgnoreCase)) return "macbook";

            return "airplay";
        }
    }
}
