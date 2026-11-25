using IgniteView.Core;
using WatsonWebserver.Core;
using HttpMethod = WatsonWebserver.Core.HttpMethod;

namespace FocalSonic.Persistence
{
    /// <summary>
    /// Keeps the frontend's React Query cache (a dehydrated snapshot, as JSON) outside the web view,
    /// so the main window (whose web view is destroyed when it closes) and the next launch can paint
    /// from it straight away while the page refetches. The page side is src-vite/src/lib/queryCache.ts.
    ///
    /// Served over plain HTTP routes rather than commands: commands run on the main thread and are
    /// slow with megabytes of JSON, while these run on the server's thread pool.
    /// </summary>
    public static class QueryCache
    {
        /// <summary>Larger snapshots are refused (the page trims its own to fit well under this).</summary>
        public const int MaxBytes = 8 * 1024 * 1024;

        /// <summary>Where builds before this persisted the cache: IgniteView's shared localStorage.</summary>
        const string LegacyLocalStorageKey = "REACT_QUERY_OFFLINE_CACHE";

        static readonly TimeSpan SaveDelay = TimeSpan.FromSeconds(2);
        static readonly object Lock = new();
        static readonly object FileLock = new();

        static byte[]? Snapshot;

        /// <summary>Bumped by every change, so that a delayed save only writes the latest snapshot once.</summary>
        static int Generation;
        static int SavedGeneration;

        static Task Loaded = Task.CompletedTask;

        static string FilePath => Path.Join(AppManager.Instance.CurrentIdentity.AppDataPath, "QueryCache.json");

        /// <summary>Call before the first window is created.</summary>
        public static void Setup()
        {
            RemoveLegacyCache();

            // Read it while the window and page start up; the page asks for it shortly after.
            Loaded = Task.Run(Load);

            Program.App.RegisterDynamicFileRoute("/query-cache", GetRoute, HttpMethod.GET);
            Program.App.RegisterDynamicFileRoute("/query-cache", PostRoute, HttpMethod.POST);
            Program.App.RegisterDynamicFileRoute("/query-cache", DeleteRoute, HttpMethod.DELETE);
        }

        /// <summary>Forgets the cache, in memory and on disk. For signing in and out.</summary>
        public static void Clear()
        {
            lock (Lock)
            {
                Snapshot = null;
                Generation++;
            }

            SaveNow();
        }

        /// <summary>Writes a pending snapshot now, for quitting.</summary>
        public static void Flush() => SaveNow();

        #region Routes

        static async Task GetRoute(HttpContextBase ctx)
        {
            AllowLocalOrigins(ctx);
            ctx.Response.Headers["Cache-Control"] = "no-store";

            await Loaded;

            byte[]? snapshot;
            lock (Lock) { snapshot = Snapshot; }

            if (snapshot == null)
            {
                ctx.Response.StatusCode = 204;
                await ctx.Response.Send();
                return;
            }

            ctx.Response.StatusCode = 200;
            ctx.Response.ContentType = "application/json";
            await ctx.Response.Send(snapshot);
        }

        static async Task PostRoute(HttpContextBase ctx)
        {
            AllowLocalOrigins(ctx);

            var body = ctx.Request.DataAsBytes;
            if (body == null || body.Length == 0 || body.Length > MaxBytes)
            {
                ctx.Response.StatusCode = 413;
                await ctx.Response.Send();
                return;
            }

            int generation;
            lock (Lock)
            {
                Snapshot = body;
                generation = ++Generation;
            }

            _ = SaveLater(generation);

            ctx.Response.StatusCode = 204;
            await ctx.Response.Send();
        }

        static async Task DeleteRoute(HttpContextBase ctx)
        {
            AllowLocalOrigins(ctx);
            Clear();

            ctx.Response.StatusCode = 204;
            await ctx.Response.Send();
        }

        /// <summary>The page is only on another origin with the Vite dev server.</summary>
        static void AllowLocalOrigins(HttpContextBase ctx)
        {
            var origin = ctx.Request.RetrieveHeaderValue("Origin");
            if (string.IsNullOrEmpty(origin) || !Uri.TryCreate(origin, UriKind.Absolute, out var uri)) return;

            if (uri.Host == "127.0.0.1" || uri.Host == "localhost")
            {
                ctx.Response.Headers["Access-Control-Allow-Origin"] = origin;
            }
        }

        #endregion

        #region Storage

        static void Load()
        {
            int generation;
            lock (Lock) { generation = Generation; }

            try
            {
                if (!File.Exists(FilePath)) return;

                var bytes = File.ReadAllBytes(FilePath);
                if (bytes.Length == 0 || bytes.Length > MaxBytes) return;

                lock (Lock)
                {
                    // Unless it was saved or cleared meanwhile.
                    if (Generation == generation)
                    {
                        Snapshot = bytes;
                        SavedGeneration = generation;
                    }
                }
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine("Couldn't read the query cache: " + ex.Message);
            }
        }

        static async Task SaveLater(int generation)
        {
            await Task.Delay(SaveDelay);

            // A newer snapshot schedules its own save.
            lock (Lock) { if (generation != Generation) return; }

            SaveNow();
        }

        static void SaveNow()
        {
            lock (FileLock)
            {
                byte[]? snapshot;
                int generation;

                lock (Lock)
                {
                    if (SavedGeneration == Generation) return;
                    snapshot = Snapshot;
                    generation = Generation;
                }

                try
                {
                    if (snapshot == null)
                    {
                        File.Delete(FilePath);
                    }
                    else
                    {
                        // Write then rename, so a crash or quit mid-write never leaves half a file.
                        var temporary = FilePath + ".tmp";
                        File.WriteAllBytes(temporary, snapshot);
                        File.Move(temporary, FilePath, true);
                    }

                    lock (Lock) { SavedGeneration = generation; }
                }
                catch (Exception ex)
                {
                    Console.Error.WriteLine("Couldn't save the query cache: " + ex.Message);
                }
            }
        }

        /// <summary>
        /// Builds before this persisted the cache into IgniteView's localStorage, where it stayed once
        /// they stopped. IgniteView sends the whole localStorage to the page on every load, and again
        /// after every write to it, so those megabytes slowed every window down.
        /// </summary>
        static void RemoveLegacyCache()
        {
            try
            {
                var storage = new LocalStorage((string?)null);
                if (storage.GetItemList().Result.Contains(LegacyLocalStorageKey))
                {
                    storage.RemoveItem(LegacyLocalStorageKey).Wait();
                }
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine("Couldn't remove the old query cache: " + ex.Message);
            }
        }

        #endregion
    }
}
