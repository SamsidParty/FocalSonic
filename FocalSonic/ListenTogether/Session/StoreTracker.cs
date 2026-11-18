using Newtonsoft.Json.Linq;

namespace FocalSonic.ListenTogether.Session
{
    /// <summary>
    /// Turns writes to the local player store into intent.
    ///
    /// The store is edited in two places at once: the session writes into it, and the UI (or
    /// the app's own queue logic) edits it. Each session write carries a version stamp, which
    /// the UI keeps in its copy, so every local write says which session state it was based
    /// on. Comparing it with the last local state on that same base gives exactly what the
    /// user changed, even when the write raced a session update coming the other way.
    /// </summary>
    public class StoreTracker
    {
        public record Recorded(LtStoreView View, List<string> Ids);

        readonly Dictionary<int, Recorded> byStamp = new();
        public int LatestWritten { get; private set; } = -1;

        public void RecordWrite(int stamp, LtStoreView view, List<string> ids)
        {
            byStamp[stamp] = new Recorded(view, ids);
            LatestWritten = Math.Max(LatestWritten, stamp);

            foreach (var old in byStamp.Keys.Where((k) => k < LatestWritten - 48).ToList()) byStamp.Remove(old);
        }

        public void RecordLocal(int stamp, LtStoreView view, List<string> ids) => byStamp[stamp] = new Recorded(view, ids);

        public Recorded? Base(int stamp) => byStamp.TryGetValue(stamp, out var recorded) ? recorded : null;

        public void Clear()
        {
            byStamp.Clear();
            LatestWritten = -1;
        }
    }

    public class LocalDiff
    {
        public List<string> Order = new();
        public List<(string Id, JObject Song)> NewItems = new();
        public HashSet<string> Removed = new();
        public string? CurrentBefore;
        public string? CurrentAfter;

        public bool OrderChanged;
        public bool CurrentChanged => CurrentBefore != CurrentAfter;

        public static LocalDiff Compute(StoreTracker.Recorded baseState, LtStoreView view, Func<string> newEntryId)
        {
            var baseItems = new List<QueueMatcher.BaseItem>();
            for (int i = 0; i < baseState.View.Current.Count && i < baseState.Ids.Count; i++)
            {
                baseItems.Add(new QueueMatcher.BaseItem(baseState.Ids[i], LtSongs.SongIdOf(baseState.View.Current[i])));
            }

            var matched = QueueMatcher.Match(baseItems, view.Current);
            var diff = new LocalDiff();

            for (int i = 0; i < view.Current.Count; i++)
            {
                var id = matched[i];
                if (id == null)
                {
                    id = newEntryId();
                    diff.NewItems.Add((id, view.Current[i]));
                }
                diff.Order.Add(id);
            }

            var kept = new HashSet<string>(diff.Order);
            foreach (var id in baseState.Ids) if (!kept.Contains(id)) diff.Removed.Add(id);

            diff.OrderChanged = !diff.Order.SequenceEqual(baseState.Ids);

            var baseIndex = baseState.View.Index;
            diff.CurrentBefore = baseIndex >= 0 && baseIndex < baseState.Ids.Count ? baseState.Ids[baseIndex] : null;
            diff.CurrentAfter = view.Index >= 0 && view.Index < diff.Order.Count ? diff.Order[view.Index] : null;
            if (view.Current.Count == 0) diff.CurrentAfter = null;

            return diff;
        }
    }
}
