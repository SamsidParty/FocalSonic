using FocalSonic.Helpers;
using FocalSonic.Presence;
using IgniteView.Core;
using Newtonsoft.Json;
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

        const string InjectionPrefix = "if (!window.injectedQueue) { window.injectedQueue = []; }\n";
        const string InjectionSuffix = "\nif (window.executeInjectedQueue) { window.executeInjectedQueue(); }";

        public bool IsPlaying = false;
        public string LoadStatus = "loading";

        public override string ChromecastCredential =>  AppleMusicKeys.MediaUserToken;

        public AppleMusicAudioPlayer(string id) : base(id) {

            LoadKeys();

            Program.App.InvokeOnMainThread(() =>
            {
                ProxyWindow = WebWindow.Create()
                    .WithTitle("Apple Music Runtime")
                    .WithURL(Program.App.CurrentServerManager.LocalBaseURL + "/meta/applemusic/proxy.html")
                    .WithBounds(new LockedWindowBounds(1280, 720))
                    .WithPlatformBasedAdditions()
                    .WithSharedContext("AppleMusicWindow", "");

                // Since we're serving from apple.com instead of localhost, interop needs to be setup manually
                ProxyWindow.ExecuteJavaScript(ScriptManager.CombinedScriptData);
                ProxyWindow.ExecuteJavaScript(new JSAssignment("window.injectedUserToken", AppleMusicKeys.MediaUserToken!));
                ProxyWindow.ExecuteJavaScript(
                    InjectionPrefix + "\n" +
                    Program.App.CurrentServerManager.Resolver.ReadFileAsText("/meta/applemusic/proxy.js") + "\n" +
                    InjectionSuffix
                );
            });
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
            var owningPlayer = ActivePlayers.Where((p) =>  p.Value is AppleMusicAudioPlayer && ((AppleMusicAudioPlayer)p.Value).ProxyWindow.ID == ctx.ID).FirstOrDefault().Value;
            owningPlayer.HandleTimeUpdate(isPlaying, currentPlaybackTime, currentPlaybackDuration);
        }

        [Command("appleMusicRecieveLoadedEvent")]
        public static void RecieveLoadedEvent(WebWindow ctx, double currentPlaybackDuration)
        {
            var owningPlayer = ActivePlayers.Where((p) => p.Value is AppleMusicAudioPlayer && ((AppleMusicAudioPlayer)p.Value).ProxyWindow.ID == ctx.ID).FirstOrDefault().Value;
            if (!owningPlayer.HasLoaded)
            {
                owningPlayer.CallLoadEvent(currentPlaybackDuration);
            }
            owningPlayer.UpdatePlaybackParameters();
        }

        [Command("appleMusicRecieveEndedEvent")]
        public static void RecieveEndedEvent(WebWindow ctx)
        {
            var owningPlayer = ActivePlayers.Where((p) => p.Value is AppleMusicAudioPlayer && ((AppleMusicAudioPlayer)p.Value).ProxyWindow.ID == ctx.ID).FirstOrDefault().Value;
            owningPlayer?.CallEndEvent();
        }

        public override async Task SetSource(string src, WebWindow ctx)
        {
            await base.SetSource(src, ctx);
            if (Source == src) { return; } // Already set

            Source = src;
            HasLoaded = false;
            IsPlaying = true;

            ProxyWindow?.ExecuteJavaScript(
                InjectionPrefix +
                $"window.injectedQueue.push({{ type: 'setSource', source: {JsonConvert.SerializeObject(src)} }});" +
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

        public override async Task SetVolume(double volume)
        {
            await base.SetVolume(volume);
            ProxyWindow?.ExecuteJavaScript(
                InjectionPrefix +
                $"window.injectedQueue.push({{ type: 'setVolume', volume: {volume / 2d} }});" +
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
