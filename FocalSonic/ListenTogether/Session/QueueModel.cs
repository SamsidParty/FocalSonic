using Newtonsoft.Json.Linq;

namespace FocalSonic.ListenTogether.Session
{
    /// <summary>One song in the session queue. The same song twice is two entries.</summary>
    public class QueueEntry
    {
        public string EntryId = "";
        public string SongId = "";
        /// <summary>Apple Music catalog id, or null for a library-only (uploaded / unmatched) song.</summary>
        public string? CatalogId;
        public string? Isrc;
        /// <summary>Participant who added it.</summary>
        public string AddedBy = "";
        /// <summary>Storefront of whoever added it: only a different storefront needs an availability check.</summary>
        public string? Storefront;
        /// <summary>For library-only songs: the only participant who can play it.</summary>
        public string? LibraryOwner;
        /// <summary>The song as shared: trimmed of anything personal or bulky.</summary>
        public JObject Song = new();
        public double Duration;

        public JObject ToJson() => new()
        {
            ["e"] = EntryId,
            ["song"] = Song,
            ["by"] = AddedBy,
            ["sf"] = Storefront,
            ["lib"] = LibraryOwner,
        };

        public static QueueEntry? FromJson(JObject json)
        {
            var entryId = json.Value<string>("e");
            if (json["song"] is not JObject song || string.IsNullOrEmpty(entryId)) return null;

            var entry = FromSong(entryId, song, json.Value<string>("by") ?? "", json.Value<string>("sf"));
            if (entry == null) return null;
            entry.LibraryOwner = json.Value<string>("lib") ?? entry.LibraryOwner;
            return entry;
        }

        /// <summary>Builds an entry from a FocalSonic song (see convertAppleMusicSongToSubsonic).</summary>
        public static QueueEntry? FromSong(string entryId, JObject song, string addedBy, string? storefront)
        {
            var songId = song.Value<string>("id");
            if (string.IsNullOrEmpty(songId)) return null;

            var catalogId = LtSongs.CatalogId(song);
            return new QueueEntry
            {
                EntryId = entryId,
                SongId = songId,
                CatalogId = catalogId,
                Isrc = song.SelectToken("appleMusic.data.attributes.isrc")?.ToString(),
                AddedBy = addedBy,
                Storefront = storefront,
                LibraryOwner = catalogId == null ? addedBy : null,
                Song = LtSongs.Shareable(song),
                Duration = song.Value<double?>("duration") ?? 0,
            };
        }
    }

    public static class LtSongs
    {
        public const string EntryIdKey = "listenTogetherEntryId";

        public static string? EntryIdOf(JObject song) => song.Value<string>(EntryIdKey);
        public static string SongIdOf(JObject song) => song.Value<string>("id") ?? "";

        /// <summary>
        /// The catalog id, which is what someone else's account can play. Library songs that
        /// are in the catalog carry it in playParams (and as the first half of their
        /// "catalog/library" playbackId); library-only ones don't have one.
        /// </summary>
        public static string? CatalogId(JObject song)
        {
            var fromParams = song.SelectToken("appleMusic.data.attributes.playParams.catalogId")?.ToString();
            if (!string.IsNullOrEmpty(fromParams)) return fromParams;

            var playbackId = song.Value<string>("playbackId");
            if (!string.IsNullOrEmpty(playbackId) && playbackId.Contains('/'))
            {
                var catalog = playbackId.Split('/')[0];
                if (IsCatalogId(catalog)) return catalog;
            }

            var id = song.Value<string>("id");
            return IsCatalogId(id) ? id : null;
        }

        /// <summary>Catalog ids are numeric; library ids look like "i.AbC123".</summary>
        public static bool IsCatalogId(string? id) => !string.IsNullOrEmpty(id) && id.All(char.IsDigit);

        /// <summary>
        /// What goes over the wire: the fields the UI shows, without the sharer's library
        /// ids, favourites or the full catalog payload (album relationships and such, which
        /// can be kilobytes per song).
        /// </summary>
        public static JObject Shareable(JObject song)
        {
            var copy = (JObject)song.DeepClone();
            copy.Remove(EntryIdKey);
            copy.Remove("starred");
            copy.Remove("playCount");
            copy.Remove("played");
            copy.Remove("path");

            if (copy["appleMusic"] is JObject appleMusic)
            {
                appleMusic.Remove("parent");
                if (appleMusic["data"] is JObject data)
                {
                    data.Remove("relationships");
                    data.Remove("meta");
                    if (data["attributes"] is JObject attributes)
                    {
                        attributes.Remove("editorialNotes");
                        attributes.Remove("previews");
                        attributes.Remove("inFavorites");
                    }
                }
            }

            return copy;
        }

        /// <summary>
        /// The entry as this participant's store holds it: playable through their own
        /// account (catalog id, or a regional equivalent), tagged with its entry id.
        /// </summary>
        public static JObject ForLocalStore(QueueEntry entry, string? localPlaybackId)
        {
            var song = (JObject)entry.Song.DeepClone();
            song[EntryIdKey] = entry.EntryId;

            if (entry.CatalogId != null)
            {
                song["id"] = entry.CatalogId;
                song["playbackId"] = localPlaybackId ?? entry.CatalogId;
                if (song["appleMusic"] is JObject appleMusic) appleMusic["libraryID"] = entry.CatalogId;
            }
            else if (localPlaybackId != null)
            {
                song["playbackId"] = localPlaybackId;
            }

            return song;
        }

        public static string PlaybackIdOf(JObject song)
        {
            var playbackId = song.Value<string>("playbackId");
            return string.IsNullOrEmpty(playbackId) ? SongIdOf(song) : playbackId;
        }
    }

    /// <summary>
    /// Works out which entry each song in a store list is. Songs written by the session carry
    /// their entry id; songs the user just added don't, and are matched to entries by song id,
    /// longest common subsequence first so reordering keeps identities, then greedily so a
    /// moved song keeps its entry. Unmatched songs are new.
    /// </summary>
    public static class QueueMatcher
    {
        public readonly record struct BaseItem(string EntryId, string SongId);

        public static string?[] Match(IReadOnlyList<BaseItem> baseItems, IReadOnlyList<JObject> songs)
        {
            var result = new string?[songs.Count];
            var usedBase = new bool[baseItems.Count];
            var baseIndex = new Dictionary<string, int>();
            for (int i = 0; i < baseItems.Count; i++) baseIndex.TryAdd(baseItems[i].EntryId, i);

            // 1. Explicit entry ids.
            for (int i = 0; i < songs.Count; i++)
            {
                var entryId = LtSongs.EntryIdOf(songs[i]);
                if (entryId != null && baseIndex.TryGetValue(entryId, out var b) && !usedBase[b] && baseItems[b].SongId == LtSongs.SongIdOf(songs[i]))
                {
                    result[i] = entryId;
                    usedBase[b] = true;
                }
            }

            // 2. LCS by song id over what's left (trimmed of the common prefix and suffix, which
            //    is nearly everything for a typical one-song edit).
            var remainingSongs = Enumerable.Range(0, songs.Count).Where((i) => result[i] == null && LtSongs.EntryIdOf(songs[i]) == null).ToList();
            var remainingBase = Enumerable.Range(0, baseItems.Count).Where((b) => !usedBase[b]).ToList();

            int start = 0;
            while (start < remainingSongs.Count && start < remainingBase.Count &&
                   LtSongs.SongIdOf(songs[remainingSongs[start]]) == baseItems[remainingBase[start]].SongId)
            {
                Assign(remainingSongs[start], remainingBase[start]);
                start++;
            }

            int endSongs = remainingSongs.Count - 1, endBase = remainingBase.Count - 1;
            while (endSongs >= start && endBase >= start &&
                   LtSongs.SongIdOf(songs[remainingSongs[endSongs]]) == baseItems[remainingBase[endBase]].SongId)
            {
                Assign(remainingSongs[endSongs], remainingBase[endBase]);
                endSongs--;
                endBase--;
            }

            var midSongs = remainingSongs.Skip(start).Take(endSongs - start + 1).ToList();
            var midBase = remainingBase.Skip(start).Take(endBase - start + 1).ToList();

            if (midSongs.Count > 0 && midBase.Count > 0 && (long)midSongs.Count * midBase.Count <= 2_000_000)
            {
                var n = midSongs.Count;
                var m = midBase.Count;
                var table = new int[n + 1, m + 1];
                for (int i = n - 1; i >= 0; i--)
                {
                    for (int j = m - 1; j >= 0; j--)
                    {
                        table[i, j] = LtSongs.SongIdOf(songs[midSongs[i]]) == baseItems[midBase[j]].SongId
                            ? table[i + 1, j + 1] + 1
                            : Math.Max(table[i + 1, j], table[i, j + 1]);
                    }
                }

                int x = 0, y = 0;
                while (x < n && y < m)
                {
                    if (LtSongs.SongIdOf(songs[midSongs[x]]) == baseItems[midBase[y]].SongId)
                    {
                        Assign(midSongs[x], midBase[y]);
                        x++;
                        y++;
                    }
                    else if (table[x + 1, y] >= table[x, y + 1]) x++;
                    else y++;
                }
            }

            // 3. Greedy: moved songs keep their entries.
            var freeBySong = new Dictionary<string, Queue<int>>();
            for (int b = 0; b < baseItems.Count; b++)
            {
                if (usedBase[b]) continue;
                if (!freeBySong.TryGetValue(baseItems[b].SongId, out var queue)) freeBySong[baseItems[b].SongId] = queue = new Queue<int>();
                queue.Enqueue(b);
            }

            for (int i = 0; i < songs.Count; i++)
            {
                if (result[i] != null || LtSongs.EntryIdOf(songs[i]) != null) continue;
                if (freeBySong.TryGetValue(LtSongs.SongIdOf(songs[i]), out var queue) && queue.Count > 0)
                {
                    Assign(i, queue.Dequeue());
                }
            }

            return result;

            void Assign(int songIndex, int b)
            {
                if (usedBase[b] || result[songIndex] != null) return;
                result[songIndex] = baseItems[b].EntryId;
                usedBase[b] = true;
            }
        }

        /// <summary>
        /// Three-way merge of a proposed order onto the host's current one. Entries the proposer
        /// removed go; entries someone else added meanwhile (unknown to the proposer) survive,
        /// placed after the entry they followed. The proposer's ordering wins otherwise.
        /// </summary>
        public static List<string> Merge(
            IReadOnlyList<string> hostCurrent,
            ISet<string>? baseSet,
            IReadOnlyList<string> proposed,
            ISet<string> removed,
            ISet<string> newIds)
        {
            var hostSet = new HashSet<string>(hostCurrent);
            var result = new List<string>();
            var resultSet = new HashSet<string>();

            foreach (var id in proposed)
            {
                if (removed.Contains(id)) continue;
                if (!(hostSet.Contains(id) || newIds.Contains(id))) continue; // removed by someone else
                if (resultSet.Add(id)) result.Add(id);
            }

            for (int i = 0; i < hostCurrent.Count; i++)
            {
                var id = hostCurrent[i];
                if (resultSet.Contains(id) || removed.Contains(id)) continue;
                // The proposer knew it and left it out: removed earlier by them.
                if (baseSet != null && baseSet.Contains(id)) continue;

                // Added concurrently. Keep it after whatever it followed for the host.
                int insertAt = 0;
                for (int j = i - 1; j >= 0; j--)
                {
                    var position = result.IndexOf(hostCurrent[j]);
                    if (position >= 0) { insertAt = position + 1; break; }
                }

                result.Insert(insertAt, id);
                resultSet.Add(id);
            }

            return result;
        }
    }

    /// <summary>The bits of a player store a session cares about.</summary>
    public class LtStoreView
    {
        public List<JObject> Current = new();
        public List<JObject> Original = new();
        public int Index;
        public bool Playing;
        public int Loop;
        public bool Shuffle;
        public string MediaType = "song";
        public string? RadioId;
        public JObject? Station;
        /// <summary>Session version this state was derived from (written by the session into the store), or -1.</summary>
        public int Stamp = -1;
        public string? StampSession;

        public JObject? CurrentSong => Index >= 0 && Index < Current.Count ? Current[Index] : null;

        public LtStoreView Clone() => new()
        {
            Current = Current.ToList(),
            Original = Original.ToList(),
            Index = Index,
            Playing = Playing,
            Loop = Loop,
            Shuffle = Shuffle,
            MediaType = MediaType,
            RadioId = RadioId,
            Station = Station,
            Stamp = Stamp,
            StampSession = StampSession,
        };
    }

    /// <summary>What the session writes into the local store.</summary>
    public class LtStoreWrite
    {
        public List<JObject> Current = new();
        public List<JObject> Original = new();
        public int Index;
        public bool Playing;
        public int Loop;
        public bool Shuffle;
        public JObject? Station;
        /// <summary>Keep the radio station id (host) or drop it (guests never resolve radio themselves).</summary>
        public string? RadioId;
        public int Stamp;
        public string SessionId = "";
    }

    /// <summary>Loop modes, matching PlayerLoopState / LoopState.</summary>
    public static class LtLoop
    {
        public const int Off = 0, All = 1, One = 2, InfiniteRadio = 3;
    }
}
