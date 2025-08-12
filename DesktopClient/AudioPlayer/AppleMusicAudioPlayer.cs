using Aonsoku.Presence;
using IgniteView.Core;
using SamsidParty.Subsonic.Proxy.AppleMusic;
using SamsidParty.Subsonic.Proxy.AppleMusic.Types;
using SoundFlow.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
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

        #region Windowing

        [DllImport("user32.dll")]
        public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

        [DllImport("user32.dll")]
        public static extern int GetWindowLong(IntPtr hWnd, int nIndex);

        [DllImport("user32.dll")]
        public static extern int SetWindowLong(IntPtr hWnd, int nIndex, int dwNewLong);

        public const int SW_HIDE = 0;
        public const int GWL_EXSTYLE = -20;
        public const int WS_EX_TOOLWINDOW = 0x00000080;
        public const int WS_EX_APPWINDOW = 0x00040000;

        public static void HideWindow(IntPtr hwnd)
        {
            int exStyle = GetWindowLong(hwnd, GWL_EXSTYLE);
            exStyle &= ~WS_EX_APPWINDOW; 
            exStyle |= WS_EX_TOOLWINDOW; 
            SetWindowLong(hwnd, GWL_EXSTYLE, exStyle);

            ShowWindow(hwnd, SW_HIDE);
        }

        #endregion

        const string InjectionPrefix = "if (!window.injectedQueue) { window.injectedQueue = []; }\n";
        const string InjectionSuffix = "\nif (window.executeInjectedQueue) { window.executeInjectedQueue(); }";

        public bool IsPlaying = false;

        public AppleMusicAudioPlayer(string id) : base(id) {
            AppleMusicKeys.Load();

            ProxyWindow = WebWindow.Create()
                .WithTitle("Apple Music Runtime")
                .WithURL("https://beta.music.apple.com/en/404") // Load 404 page on purpose to prevent content from loading
                .WithBounds(new LockedWindowBounds(200, 200))
                .WithoutTitleBar()
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
        }

        [Command("appleMusicRecieveLoadedEvent")]
        public static void RecieveLoadedEvent(WebWindow ctx, double currentPlaybackDuration)
        {
            var owningPlayer = ActivePlayers.Where((p) => p.Value is AppleMusicAudioPlayer && ((AppleMusicAudioPlayer)p.Value).ProxyWindow.ID == ctx.ID).FirstOrDefault().Value;
            if (!owningPlayer.HasLoaded)
            {
                HideWindow((owningPlayer as AppleMusicAudioPlayer).ProxyWindow.NativeHandle);
                owningPlayer.CallLoadEvent(currentPlaybackDuration);
            }
        }

        [Command("appleMusicRecieveEndedEvent")]
        public static void RecieveEndedEvent(WebWindow ctx)
        {
            var owningPlayer = ActivePlayers.Where((p) => p.Value is AppleMusicAudioPlayer && ((AppleMusicAudioPlayer)p.Value).ProxyWindow.ID == ctx.ID).FirstOrDefault().Value;
            owningPlayer?.CallEndEvent();
        }

        public override async Task SendTimeUpdate(bool isAutomatic = true)
        {
            Presence.Presence.Instance.UpdateMediaStatus(MediaPlaybackInfo.Instance);
        }

        public override async Task SetSource(string src, WebWindow ctx)
        {
            if (Source == src) { return; } // Already set

            Source = src;
            HasLoaded = false;
            IsPlaying = true;
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
            AssociatedWindow?.CallFunction("handleAudioEvent_" + ID, "timeupdate", time);
            ProxyWindow?.ExecuteJavaScript(
                InjectionPrefix +
                $"window.injectedQueue.push({{ type: 'seek', time: {time.ToString()} }});" +
                InjectionSuffix
            );
        }

        public override async Task SetLoopMode(bool loop)
        {
            ProxyWindow?.ExecuteJavaScript(
                InjectionPrefix +
                $"window.injectedQueue.push({{ type: 'setLoopMode', loop: {loop.ToString().ToLower()} }});" +
                InjectionSuffix
            );
        }
    }
}
