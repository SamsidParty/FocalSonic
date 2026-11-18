using FocalSonic.ListenTogether.Core;
using FocalSonic.ListenTogether.Transport;
using Newtonsoft.Json.Linq;

namespace FocalSonic.ListenTogether.Session
{
    /// <summary>A guest, as the host sees them.</summary>
    public class Participant
    {
        public string Id = "";
        public string Name = "";
        public string Storefront = "";
        public string Platform = "";
        public string ResumeHash = "";
        public PeerLink? Link;
        public double JoinedAt = MonoClock.NowMs;
        public double DisconnectedAt;
        public bool EverConnected;
        public LtPermissions Permissions = new();
        public ParticipantStatus Status = new();
        public HashSet<string> Unavailable = new();
        /// <summary>Entry bodies this guest already has, so state updates only carry new ones.</summary>
        public HashSet<string> SentEntries = new();
        public int LastSentVersion = -1;

        public bool Connected => Link?.State == PeerLinkState.Open;

        public JObject ToJson(bool isYou = false) => new()
        {
            ["id"] = Id,
            ["name"] = Name,
            ["host"] = false,
            ["you"] = isYou,
            ["state"] = Connected ? "connected" : "reconnecting",
            ["sync"] = Connected ? Status.Sync : "offline",
            ["drift"] = Status.DriftMs,
            ["route"] = Link?.Route ?? Status.Route,
            ["rtt"] = Status.RttMs,
            ["sf"] = Storefront,
            ["platform"] = Platform,
        };
    }

    public static class LtText
    {
        public static string CleanName(string? name, string fallback)
        {
            var cleaned = new string((name ?? "").Where((c) => !char.IsControl(c)).ToArray()).Trim();
            if (cleaned.Length > 32) cleaned = cleaned[..32].Trim();
            return string.IsNullOrEmpty(cleaned) ? fallback : cleaned;
        }

        public static string Title(QueueEntry? entry) => entry?.Song.Value<string>("title") ?? "a song";

        public static string Songs(int count, QueueEntry? first) =>
            count == 1 ? $"\"{Title(first)}\"" : $"{count} songs";
    }
}
