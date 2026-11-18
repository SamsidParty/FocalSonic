using FocalSonic.ListenTogether.Core;
using Newtonsoft.Json.Linq;

namespace FocalSonic.ListenTogether.Session
{
    /// <summary>
    /// Whether this participant's account can play each entry. Catalogs differ between
    /// storefronts (licensing), so a song someone in another country added may not exist
    /// here. When it doesn't, the same recording is often in this storefront under another
    /// id, found by ISRC, and played instead.
    /// </summary>
    public class Availability
    {
        public enum Status { Unknown, Playable, Substituted, Unavailable }

        public record Result(Status Status, string? PlaybackId);

        readonly Func<string, Task<JObject?>> appleMusicGet;
        readonly string storefront;
        readonly string participantId;
        readonly Dictionary<string, Result> byCatalogId = new();
        readonly Dictionary<string, Result> runtimeFailures = new();
        readonly object gate = new();

        public Availability(Func<string, Task<JObject?>> appleMusicGet, string storefront, string participantId)
        {
            this.appleMusicGet = appleMusicGet;
            this.storefront = storefront;
            this.participantId = participantId;
        }

        public Result Get(QueueEntry entry)
        {
            lock (gate)
            {
                if (runtimeFailures.TryGetValue(entry.EntryId, out var failed)) return failed;

                if (entry.CatalogId == null)
                {
                    // Library-only: only its owner has it.
                    return entry.LibraryOwner == participantId
                        ? new Result(Status.Playable, LtSongs.PlaybackIdOf(entry.Song))
                        : new Result(Status.Unavailable, null);
                }

                // Same storefront as whoever added it: it played for them, so it's here too.
                if (entry.Storefront == null || entry.Storefront == storefront || entry.AddedBy == participantId)
                {
                    return new Result(Status.Playable, entry.CatalogId);
                }

                return byCatalogId.TryGetValue(entry.CatalogId, out var result) ? result : new Result(Status.Unknown, entry.CatalogId);
            }
        }

        /// <summary>The track couldn't actually be played (DRM, account restrictions, a bad id).</summary>
        public void MarkFailed(string entryId)
        {
            lock (gate) runtimeFailures[entryId] = new Result(Status.Unavailable, null);
        }

        /// <summary>Looks up whatever isn't known yet. Returns true if anything changed.</summary>
        public async Task<bool> Refresh(IEnumerable<QueueEntry> entries)
        {
            List<QueueEntry> pending;
            lock (gate)
            {
                pending = entries
                    .Where((e) => e.CatalogId != null && Get(e).Status == Status.Unknown)
                    .GroupBy((e) => e.CatalogId!)
                    .Select((g) => g.First())
                    .ToList();
            }

            if (pending.Count == 0) return false;
            var changed = false;

            foreach (var batch in pending.Chunk(200))
            {
                var ids = string.Join(",", batch.Select((e) => e.CatalogId));
                var response = await appleMusicGet($"catalog/{storefront}/songs?ids={ids}");
                if (response == null)
                {
                    // Network trouble: leave them unknown (assumed playable) and retry later.
                    continue;
                }

                var found = new HashSet<string>();
                foreach (var song in (response["data"] as JArray)?.OfType<JObject>() ?? Enumerable.Empty<JObject>())
                {
                    var id = song.Value<string>("id");
                    if (id != null && song.SelectToken("attributes.playParams") != null) found.Add(id);
                }

                var missing = new List<QueueEntry>();
                lock (gate)
                {
                    foreach (var entry in batch)
                    {
                        if (found.Contains(entry.CatalogId!))
                        {
                            byCatalogId[entry.CatalogId!] = new Result(Status.Playable, entry.CatalogId);
                        }
                        else
                        {
                            missing.Add(entry);
                        }
                    }
                }

                foreach (var entry in missing)
                {
                    var substitute = await FindByIsrc(entry);
                    lock (gate)
                    {
                        byCatalogId[entry.CatalogId!] = substitute != null
                            ? new Result(Status.Substituted, substitute)
                            : new Result(Status.Unavailable, null);
                    }
                    LtLog.Info(substitute != null
                        ? $"\"{entry.Song.Value<string>("title")}\" isn't in the {storefront} catalog; using {substitute} (same ISRC)"
                        : $"\"{entry.Song.Value<string>("title")}\" isn't available in the {storefront} catalog");
                }

                changed = true;
            }

            return changed;
        }

        async Task<string?> FindByIsrc(QueueEntry entry)
        {
            if (string.IsNullOrEmpty(entry.Isrc)) return null;

            var response = await appleMusicGet($"catalog/{storefront}/songs?filter[isrc]={Uri.EscapeDataString(entry.Isrc)}");
            var candidates = (response?["data"] as JArray)?.OfType<JObject>()
                .Where((s) => s.SelectToken("attributes.playParams") != null)
                .ToList();

            if (candidates == null || candidates.Count == 0) return null;

            // Prefer the version closest in length (a remaster can share an ISRC with the original).
            return candidates
                .OrderBy((s) => Math.Abs((s.SelectToken("attributes.durationInMillis")?.Value<double>() ?? 0) / 1000.0 - entry.Duration))
                .First()
                .Value<string>("id");
        }
    }
}
