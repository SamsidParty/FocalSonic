using FocalSonic.Helpers;
using FocalSonic.Presence;
using IgniteView.Core;
using Newtonsoft.Json;
using SamsidParty.Subsonic.Common.Types;
using System.Dynamic;
using System.Web;

namespace FocalSonic.AppleMusic
{
    public class AppleMusicAudioPlayer : AudioPlayer.AudioPlayer
    {
        /// <summary>
        /// Due to DRM, we need a webwindow with url https://music.apple.com to play audio from apple music.
        /// The webwindow should have widevine and built in so it should be easy to play audio using it.
        /// </summary>
        WebWindow ProxyWindow;

        public static AppleMusicAudioPlayer GetOwningPlayer(WebWindow ctx) => ActivePlayers.Where((p) => p.Value is AppleMusicAudioPlayer && ((AppleMusicAudioPlayer)p.Value).ProxyWindow.ID == ctx.ID).FirstOrDefault().Value as AppleMusicAudioPlayer;

        const string InjectionPrefix = "if (!window.injectedQueue) { window.injectedQueue = []; }\n";
        const string InjectionSuffix = "\nif (window.executeInjectedQueue) { window.executeInjectedQueue(); }";

        public bool IsPlaying = false;
        public bool IsTransitioning = false;
        public bool IsNextSourcePreloaded = false;
        public string LoadStatus = "loading";

        public override string ChromecastCredential =>  AppleMusicKeys.MediaUserToken;

        public const int NEXT_TRACK_PRELOAD_OFFSET = 30;
        public const int NEXT_TRACK_TRANSITION_OFFSET = 5;
        public const int NEXT_TRACK_TRANSITION_DURATION = 10;

        public AppleMusicAudioPlayer(string id) : base(id) {

            LoadKeys();

            Program.App.InvokeOnMainThread(() =>
            {
                ProxyWindow = WebWindow.Create()
                    .WithTitle("Apple Music Runtime")
                    .WithURL($"https://beta.music.apple.com/{AppleMusicKeys.Region}/home")
                    .WithBounds(new LockedWindowBounds(1280, 720))
                    .WithPlatformBasedAdditions()
                    .WithSharedContext("AppleMusicWindow", "");

                // Since we're serving from apple.com instead of localhost, interop needs to be setup manually
                ProxyWindow.ExecuteJavaScript(ScriptManager.CombinedScriptData);
                InitializeProxy(ProxyWindow);
            });
        }

        public static void InitializeProxy(WebWindow ctx)
        {
            ctx.ExecuteJavaScript(new JSAssignment("window.injectedUserToken", AppleMusicKeys.MediaUserToken!));
            ctx.ExecuteJavaScript(
                InjectionPrefix + "\n" +
                Program.App.CurrentServerManager.Resolver.ReadFileAsText("/meta/applemusic/proxy.js") + "\n" +
                InjectionSuffix
            );
        }

        #region Player

        [Command("setAppleMusicPlayerLoadStatus")]
        public static async Task SetAppleMusicPlayerLoadStatus(string loadStatus, WebWindow ctx)
        {
            var owningPlayer = ActivePlayers.Where((p) => p.Value is AppleMusicAudioPlayer && ((AppleMusicAudioPlayer)p.Value).ProxyWindow.ID == ctx.ID).FirstOrDefault().Value as AppleMusicAudioPlayer;
            owningPlayer.LoadStatus = loadStatus;
        }

        [Command("appleMusicRecieveTimeUpdate")]
        public static void RecieveTimeUpdate(WebWindow ctx, bool isPlaying, double currentPlaybackTime, double currentPlaybackDuration)
        {
            var owningPlayer = GetOwningPlayer(ctx);

            // Handle preloading next source and transitions
            if (
                owningPlayer is AppleMusicAudioPlayer &&
                isPlaying &&
                currentPlaybackDuration > 0 &&
                currentPlaybackTime > 0
            )
            {
                var appleMusicPlayer = (owningPlayer as AppleMusicAudioPlayer);
                var distanceFromEnd = (currentPlaybackDuration - currentPlaybackTime);

                if (
                    distanceFromEnd <= NEXT_TRACK_PRELOAD_OFFSET && // Ensure in preload zone
                    distanceFromEnd > (NEXT_TRACK_TRANSITION_OFFSET + 5) && // Ignore if in transition zone
                    !appleMusicPlayer.IsNextSourcePreloaded
                )
                {
                    // Preload (Disabled For Now)
                    //appleMusicPlayer.PreloadNextSource(ctx);
                }
                else if (
                    distanceFromEnd <= (NEXT_TRACK_TRANSITION_OFFSET + 1) && // Ensure in transition zone
                    appleMusicPlayer.IsNextSourcePreloaded &&
                    !appleMusicPlayer.IsTransitioning
                )
                {
                    // Transition (Disabled For Now)
                    //appleMusicPlayer.TransitionSources(ctx);
                }
            }

            owningPlayer.HandleTimeUpdate(isPlaying, currentPlaybackTime, currentPlaybackDuration);
        }

        [Command("appleMusicRecieveLoadedEvent")]
        public static void RecieveLoadedEvent(WebWindow ctx, double currentPlaybackDuration)
        {
            var owningPlayer = GetOwningPlayer(ctx);
            if (!owningPlayer.HasLoaded)
            {
                owningPlayer.CallLoadEvent(currentPlaybackDuration);
            }
            owningPlayer.UpdatePlaybackParameters();
        }

        [Command("appleMusicRecieveEndedEvent")]
        public static void RecieveEndedEvent(WebWindow ctx)
        {
            var owningPlayer = GetOwningPlayer(ctx);
            owningPlayer?.CallEndEvent();
        }

        public override async Task SetSource(string src, WebWindow ctx)
        {
            await base.SetSource(src, ctx);
            if (Source == src) { return; } // Already set

            Source = src;
            HasLoaded = false;
            IsPlaying = true;
            IsTransitioning = false;
            IsNextSourcePreloaded = false;

            ProxyWindow?.ExecuteJavaScript(
                InjectionPrefix +
                $"window.injectedQueue.push({{ type: 'setSource', source: {JsonConvert.SerializeObject(src)} }});" +
                InjectionSuffix
            );

            await UpdatePlaybackParameters();
        }

        // Apple Music only: Handles all the licensing and DRM stuff early to create a smooth transition to the next track
        public async Task PreloadNextSource(WebWindow ctx)
        {
            if (IsNextSourcePreloaded) { return; }
            IsNextSourcePreloaded = true;

            // Try to determine the next source based on the queue
            if (MediaPlaybackInfo.Instance == null || MediaPlaybackInfo.Instance.NextQueueItem == null) { return; }
            var trackID = (await MediaPlaybackInfo.Instance.ResolveNextSong()).Id;
            var src = MediaPlaybackInfo.Instance.Store.ExtraProperties.GetStreamURLForSong(trackID);

            if (Source == src || string.IsNullOrEmpty(src)) { return; }

            ProxyWindow?.ExecuteJavaScript(
                InjectionPrefix +
                $"window.injectedQueue.push({{ type: 'preloadNextSource', source: {JsonConvert.SerializeObject(src)} }});" +
                InjectionSuffix
            );

            await UpdatePlaybackParameters();
        }

        // Apple Music only: Creates a smooth transition to the next track
        public async Task TransitionSources(WebWindow ctx)
        {
            if (!IsNextSourcePreloaded || IsTransitioning) { return; }
            if (MediaPlaybackInfo.Instance == null || MediaPlaybackInfo.Instance.NextQueueItem == null) { return; }

            IsTransitioning = true;

            ProxyWindow?.ExecuteJavaScript(
                InjectionPrefix +
                $"window.injectedQueue.push({{ type: 'transitionSources', duration: {NEXT_TRACK_TRANSITION_DURATION * 1000f}, nextSongID: {JsonConvert.SerializeObject(MediaPlaybackInfo.Instance.NextQueueItem.Id)} }});" +
                InjectionSuffix
            );

            await UpdatePlaybackParameters();
        }

        public override async Task SetOutputDevice(string outputDevice)
        {
            await base.SetOutputDevice(outputDevice);

            ProxyWindow?.ExecuteJavaScript(
                InjectionPrefix +
                $"window.injectedQueue.push({{ type: 'setOutputDevice', outputDevice: {JsonConvert.SerializeObject(outputDevice)} }});" +
                InjectionSuffix
            );

            await UpdatePlaybackParameters();
        }

        public override async Task PlayAudio()
        {
            await base.PlayAudio();
            if (IsPlaying) { return; }
            IsPlaying = true;
            ProxyWindow?.ExecuteJavaScript(
                InjectionPrefix +
                $"window.injectedQueue.push({{ type: 'play' }});" +
                InjectionSuffix
            );
        }

        public override async Task PauseAudio()
        {
            await base.PauseAudio();
            if (!IsPlaying) { return; }
            IsPlaying = false;
            ProxyWindow?.ExecuteJavaScript(
                InjectionPrefix +
                $"window.injectedQueue.push({{ type: 'pause' }});" +
                InjectionSuffix
            );
        }

        public override async Task SeekAudio(double time)
        {
            await base.SeekAudio(time);
            AssociatedWindow?.CallFunction("handleAudioEvent_" + ID, "timeupdate", time);
            ProxyWindow?.ExecuteJavaScript(
                InjectionPrefix +
                $"window.injectedQueue.push({{ type: 'seek', time: {time.ToString()} }});" +
                InjectionSuffix
            );
        }

        public override async Task SetLoopMode(bool loop)
        {
            await base.SetLoopMode(loop);
            ProxyWindow?.ExecuteJavaScript(
                InjectionPrefix +
                $"window.injectedQueue.push({{ type: 'setLoopMode', loop: {loop.ToString().ToLower()} }});" +
                InjectionSuffix
            );
        }

        public override async Task SetEnableAtmos(bool atmos)
        {
            await base.SetEnableAtmos(atmos);
            ProxyWindow?.ExecuteJavaScript(
                InjectionPrefix +
                $"window.injectedQueue.push({{ type: 'setEnableAtmos', enabled: {atmos.ToString().ToLower()} }});" +
                InjectionSuffix
            );
        }

        public override async Task SetVolume(double volume)
        {
            await base.SetVolume(volume);
            ProxyWindow?.ExecuteJavaScript(
                InjectionPrefix +
                $"window.injectedQueue.push({{ type: 'setVolume', volume: {volume} }});" +
                InjectionSuffix
            );
        }

        public override async Task SetSpeed(double speed)
        {
            await base.SetSpeed(speed);
            ProxyWindow?.ExecuteJavaScript(
                InjectionPrefix +
                $"window.injectedQueue.push({{ type: 'setSpeed', speed: {speed} }});" +
                InjectionSuffix
            );
        }

        public override async Task SetFilterData(string filterData)
        {
            await base.SetFilterData(filterData);
            if (string.IsNullOrEmpty(filterData)) return;
            filterData = JsonConvert.SerializeObject(JsonConvert.DeserializeObject(filterData)); // Sanitize and validate
            ProxyWindow?.ExecuteJavaScript(
                InjectionPrefix +
                $"window.injectedQueue.push({{ type: 'setFilterData', filterData: {filterData} }});" +
                InjectionSuffix
            );
        }

        #endregion

        #region Sign In

        [Command("signInToAppleMusic")]
        public static async Task SignInToAppleMusic(WebWindow ctx)
        {
            // Close any existing sign in windows
            Program.App.OpenWindows.Where((a) => a.SharedContext.ContainsKey("AppleMusicSignIn")).FirstOrDefault()?.Close();

            await Program.App.InvokeOnMainThread(() => {
                var signInWindow = WebWindow.Create()
                    .WithTitle("Apple Music")
                    .WithURL("https://beta.music.apple.com/us/login")
                    .WithBounds(new LockedWindowBounds(1200, 720))
                    .WithPlatformBasedAdditions()
                    .WithSharedContext("AppleMusicSignIn", "")
                    .Show();

                signInWindow.ExecuteJavaScript(ScriptManager.CombinedScriptData);
                signInWindow.ExecuteJavaScript(Program.App.CurrentServerManager.Resolver.ReadFileAsText("/meta/applemusic/signin.js"));
            });
        }

        [Command("appleMusicSignInRecieveToken")]
        public static async Task AppleMusicSignInRecieveToken(string mediaUserToken, string developerToken)
        {
            LocalStorage.SetItem("applemusic_media_user_token", mediaUserToken, "default");
            LocalStorage.SetItem("applemusic_developer_token", developerToken, "default");
            LoadKeys();

            try
            {
                // We have to find the user's account region because apple is very picky
                // If the region is wrong then we can only stream the previews of the music
                dynamic data = await AppleMusicHttpClient.SendRequest<ExpandoObject>($"me/storefront");
                LocalStorage.SetItem("applemusic_region", data!.data[0]!.id!, "default");

                Program.MainWindow?.CallFunction("window._localStorage.hydrate", LocalStorage.GetAllItems("default")); // Reload localStorage
                Program.MainWindow?.CallFunction("window.completeAppleMusicLogin");
            }
            catch
            {
                // The token is probably invalid
            }
        }

        public override void Dispose()
        {
            ProxyWindow?.Close();
            base.Dispose();
        }

        #endregion

        #region Proxy

        [Command("loadAppleMusicKeys")]
        public static void LoadKeys()
        {
            try
            {
                AppleMusicKeys.AppleDeveloperToken = LocalStorage.GetItem("applemusic_developer_token", "default");
                AppleMusicKeys.MediaUserToken = LocalStorage.GetItem("applemusic_media_user_token", "default");
                AppleMusicKeys.Region = LocalStorage.GetItem("applemusic_region", "default") ?? "us";
            }
            catch { }
        }

        [Command("saveAppleMusicDeveloperKey")]
        public static void SaveDeveloperKey(string developerKey)
        {
            LocalStorage.SetItem("applemusic_developer_token", developerKey, "default");
            LoadKeys();
        }

        [Command("transferAppleMusicProxyToMainWindow")]
        public static void TransferAppleMusicProxyToMainWindow(WebWindow ctx)
        {
            #if LINUX
            // For linux, background webwindows are not supported, so we need to transfer the proxy to the main window
            var owningPlayer = GetOwningPlayer(ctx);
            owningPlayer.ProxyWindow.Close(); // Close the old proxy window
            owningPlayer.ProxyWindow = Program.MainWindow;
            InitializeProxy(owningPlayer.ProxyWindow);
            #endif
        }

        [Command("logOutOfAppleMusic")]
        public static async Task LogOutOfAppleMusic()
        {
            await DisposeAudioPlayers();
            LocalStorage.RemoveItem("applemusic_media_user_token", "default");
            LocalStorage.RemoveItem("applemusic_developer_token", "default");
            LocalStorage.RemoveItem("applemusic_region", "default");
            LoadKeys();
        }

        [Command("waitUntilAppleMusicLoads")]
        public static async Task<string> WaitUntilAppleMusicLoads(WebWindow ctx)
        {
            
            if (ActivePlayers.Where((p) => p.Value is AppleMusicAudioPlayer).Any())
            {
                var activePlayer = ActivePlayers.Where((p) => p.Value is AppleMusicAudioPlayer).FirstOrDefault().Value as AppleMusicAudioPlayer;

                // Wait until the proxy window is loaded
                while (activePlayer.LoadStatus == "loading")
                {
                    await Task.Delay(100);
                }

                return activePlayer.LoadStatus;
            }
            else
            {
                // If no player exists, create one
                await CreateAudioPlayer("appleMusicPlayer", ctx);

                while (!ActivePlayers.Where((p) => p.Value is AppleMusicAudioPlayer).Any())
                {
                    await Task.Delay(100);
                }

                return await WaitUntilAppleMusicLoads(ctx);
            }
        }

        #endregion
    }
}
