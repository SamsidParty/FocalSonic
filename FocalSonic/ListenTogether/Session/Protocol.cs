using FocalSonic.ListenTogether.Core;
using Newtonsoft.Json.Linq;

namespace FocalSonic.ListenTogether.Session
{
    /// <summary>
    /// Wire protocol. Every message is a JSON object with "t" (type).
    ///
    /// Signaling (sealed, through the mailbox):
    ///   guest → room inbox:  join   {proto, pid, resume, name, sf, platform, app, inbox, offer}
    ///   host → guest inbox:  answer {sid, answer} | reject {reason, message}
    ///
    /// Peer link, guest → host:
    ///   ping {t0} · op {id, ops[]} · status {...} · avail {unavail[]} · need {e[]} · bye
    /// Peer link, host → guest:
    ///   pong {t0,t1,t2} · welcome {...} · state {...} · anchor {...} · ack {id, ok, err} · peers {list} · notice {...} · end {reason}
    ///
    /// Ops: propose {base, order[], removed[], items[], cur?} · play · pause · seek {e,pos} ·
    ///      next {from} · prev {from} · loop {s} · shuffle {on} · fx {speed, filter} · clear
    /// </summary>
    public static class LtProtocol
    {
        /// <summary>Bump on incompatible changes; peers with a different version are turned away with a clear message.</summary>
        public const int Version = 1;
        public const int MaxParticipants = 16;
        public const int MaxQueue = 5000;
        public const int MaxItemsPerOp = 2000;

        public static JObject Anchor(PlaybackAnchor anchor) => new()
        {
            ["t"] = "anchor",
            ["e"] = anchor.EntryId,
            ["p"] = anchor.PlayId,
            ["pos"] = anchor.Position,
            ["at"] = anchor.HostTimeMs,
            ["rate"] = anchor.Rate,
            ["playing"] = anchor.Playing,
            ["pending"] = anchor.Pending,
            ["dur"] = anchor.Duration,
            ["seq"] = anchor.Seq,
        };

        public static PlaybackAnchor ParseAnchor(JObject json) => new()
        {
            EntryId = json.Value<string>("e"),
            PlayId = json.Value<int?>("p") ?? 0,
            Position = json.Value<double?>("pos") ?? 0,
            HostTimeMs = json.Value<double?>("at") ?? 0,
            Rate = Math.Clamp(json.Value<double?>("rate") ?? 1, 0.0625, 16),
            Playing = json.Value<bool?>("playing") ?? false,
            Pending = json.Value<bool?>("pending") ?? false,
            Duration = json.Value<double?>("dur") ?? 0,
            Seq = json.Value<int?>("seq") ?? 0,
        };

        public static double EffectiveRate(double speed) => speed > 0 ? Math.Clamp(speed, 0.0625, 16) : 1;

        public static List<string> Ids(JToken? token) =>
            (token as JArray)?.Select((t) => t.Type == JTokenType.String ? t.ToString() : null).Where((s) => !string.IsNullOrEmpty(s)).Select((s) => s!).ToList() ?? new List<string>();
    }

    /// <summary>Things a participant may be allowed to do. Everything is allowed for now; the checks are in place for approvals later.</summary>
    public class LtPermissions
    {
        public bool Playback = true;
        public bool Queue = true;
        public bool Effects = true;

        public JObject ToJson() => new() { ["playback"] = Playback, ["queue"] = Queue, ["effects"] = Effects };

        public static LtPermissions FromJson(JObject? json) => new()
        {
            Playback = json?.Value<bool?>("playback") ?? true,
            Queue = json?.Value<bool?>("queue") ?? true,
            Effects = json?.Value<bool?>("effects") ?? true,
        };

        public bool Allows(string op) => op switch
        {
            "play" or "pause" or "seek" or "next" or "prev" or "loop" => Playback,
            "propose" or "shuffle" or "clear" => Queue,
            "fx" => Effects,
            _ => false,
        };
    }

    /// <summary>Sent by guests every couple of seconds so everyone can see how in sync they are.</summary>
    public class ParticipantStatus
    {
        public string Sync = "waiting";
        public double? DriftMs;
        public string? Route;
        public double? RttMs;

        public JObject ToJson() => new() { ["sync"] = Sync, ["drift"] = DriftMs, ["route"] = Route, ["rtt"] = RttMs };
    }
}
