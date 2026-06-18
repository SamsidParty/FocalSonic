using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.NetworkInformation;
using System.Threading.Tasks;
using Zeroconf;

namespace FocalSonic.Casting.AirPlay
{
    // Discovers AirPlay receivers (Apple TV / HomePod) via Bonjour/mDNS using the
    // Zeroconf package — the same one GoogleCast already pulls in transitively.
    // We deliberately do discovery here in C# (not by spawning the Python module)
    // so a scan is cheap and the module is only launched once a device is picked.
    public static class AirPlayDiscovery
    {
        // _airplay._tcp carries a clean friendly name and the device identifier
        // (TXT "deviceid"), which is what pyatv matches on.
        const string AirPlayServiceType = "_airplay._tcp.local.";

        public static async Task<List<CastDeviceReference>> ScanAsync(TimeSpan? scanTime = null)
        {
            var devices = new List<CastDeviceReference>();

            try
            {
                // Scan only on IPv4-capable interfaces. If we let Zeroconf enumerate
                // every adapter it calls GetIPv4Properties() on each, which throws
                // NetworkInformationException ("protocol not configured") on adapters
                // without IPv4 (VPN/tunnel/virtual). Passing a pre-filtered list both
                // avoids that path and guarantees every adapter we hand it has IPv4.
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

                    devices.Add(CastDeviceReference.GetAirPlay(name, address, identifier));
                }
            }
            catch
            {
                // Network/mDNS errors should never break the device picker — just
                // return whatever (possibly nothing) we found.
            }

            return devices;
        }

        // Up, non-loopback/tunnel, IPv4-configured interfaces. Each candidate is
        // probed exactly the way Zeroconf will use it (GetIPv4Properties), so any
        // adapter that would throw is skipped here instead of inside Zeroconf.
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

                        // Supports() is the non-throwing IPv4 check. GetIPv4Properties()
                        // would *throw* ("protocol not configured") on IPv4-less adapters
                        // — including as a first-chance exception while debugging — so we
                        // avoid it entirely and confirm IPv4 via a bound unicast address.
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

        static string ExtractDeviceId(IZeroconfHost host)
        {
            foreach (var service in host.Services.Values)
            {
                foreach (var props in service.Properties)
                {
                    if (props.TryGetValue("deviceid", out var deviceId) && !string.IsNullOrEmpty(deviceId))
                    {
                        return deviceId;
                    }
                }
            }
            return "";
        }
    }
}
