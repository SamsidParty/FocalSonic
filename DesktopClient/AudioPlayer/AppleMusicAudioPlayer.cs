using Aonsoku.Presence;
using IgniteView.Core;
using SamsidParty.Subsonic.Proxy.AppleMusic;
using SoundFlow.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web;

namespace Aonsoku.AudioPlayer
{
    public class AppleMusicAudioPlayer : AudioPlayer
    {
        /// <summary>
        /// Due to DRM, we need a webwindow with url https://music.apple.com to play audio from apple music.
        /// The webwindow should have widevine and built in so it should be easy to play audio using it.
        /// </summary>
        WebWindow ProxyWindow;

        const string InjectionPrefix = "if (!window.injectedQueue) { window.injectedQueue = []; }\n";
        const string InjectionSuffix = "\nif (window.executeInjectedQueue) { window.executeInjectedQueue(); }";

        public AppleMusicAudioPlayer(string id) : base(id) {
            AppleMusicKeys.Load();

            ProxyWindow = WebWindow.Create()
                .WithTitle("Apple Music Runtime")
                .WithURL("https://beta.music.apple.com/en/404") // Load 404 page on purpose to prevent content from loading
                .WithSharedContext("AppleMusicWindow", "")
                .Show();

            // Since we're serving from apple.com instead of localhost, interop needs to be setup manually
            ProxyWindow.ExecuteJavaScript(ScriptManager.CombinedScriptData); 
            ProxyWindow.ExecuteJavaScript(new JSAssignment("window.injectedUserToken", AppleMusicKeys.MediaUserToken!)); 
            ProxyWindow.ExecuteJavaScript(
                InjectionPrefix + 
                Program.App.CurrentServerManager.Resolver.ReadFileAsText("/meta/applemusic/proxy.js") + 
                InjectionSuffix
            );
        }

        [Command("appleMusicRecieveTimeUpdate")]
        public static void RecieveTimeUpdate(WebWindow ctx, bool isPlaying, double currentPlaybackTime, double currentPlaybackDuration)
        {
            var owningPlayer = ActivePlayers.Where((p) =>  p.Value is AppleMusicAudioPlayer && ((AppleMusicAudioPlayer)p.Value).ProxyWindow.ID == ctx.ID).FirstOrDefault().Value;
            if (isPlaying)
            {
                owningPlayer.AssociatedWindow?.CallFunction("handleAudioEvent_" + owningPlayer.ID, "timeupdate", currentPlaybackTime);
            }

            MediaPlaybackInfo.Instance.IsPlaying = isPlaying;
            MediaPlaybackInfo.Instance.Duration = TimeSpan.FromSeconds(currentPlaybackDuration);
            MediaPlaybackInfo.Instance.Position = TimeSpan.FromSeconds(currentPlaybackTime);

            if (isPlaying && !owningPlayer.HasLoaded && currentPlaybackDuration > 0)
            {
                owningPlayer.HasLoaded = true;
                owningPlayer.AssociatedWindow?.CallFunction("handleAudioEvent_" + owningPlayer.ID, "loaded", currentPlaybackDuration);
            }
        }

        public override async Task SendTimeUpdate(bool isAutomatic = true)
        {
            Presence.Presence.Instance.UpdateMediaStatus(MediaPlaybackInfo.Instance);
        }

        public override async Task SetSource(string src, WebWindow ctx)
        {
            HasLoaded = false;
            var uri = new Uri(src);
            var musicID = HttpUtility.ParseQueryString(uri.Query).Get("id");
            ProxyWindow?.ExecuteJavaScript(
                InjectionPrefix +
                $"window.injectedQueue.push({{ type: 'setSource', source: '{musicID.Split(":", StringSplitOptions.RemoveEmptyEntries)[2]}' }});" +
                InjectionSuffix
            );
        }

        public override async Task PlayAudio()
        {
            ProxyWindow?.ExecuteJavaScript(
                InjectionPrefix +
                $"window.injectedQueue.push({{ type: 'play' }});" +
                InjectionSuffix
            );
        }

        public override async Task PauseAudio()
        {
            ProxyWindow?.ExecuteJavaScript(
                InjectionPrefix +
                $"window.injectedQueue.push({{ type: 'pause' }});" +
                InjectionSuffix
            );
        }
    }
}
