using FocalSonic.Helpers;
using IgniteView.Core;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FocalSonic.LastFM
{
    public class LastFMSignIn
    {

        public static bool IsWaitingForToken = false;

        [Command("signInToLastFM")]
        public static async Task SignInToLastFM()
        {
            // Close any existing sign in windows
            Program.App.OpenWindows.Where((a) => a.SharedContext.ContainsKey("LastFMSignIn")).FirstOrDefault()?.Close();

            await Program.App.InvokeOnMainThread(async () => {
                IsWaitingForToken = true;

                var signInWindow = WebWindow.Create()
                    .WithTitle("Sign in to Last.FM")
                    .WithURL($"https://www.last.fm/api/auth?api_key={Uri.EscapeDataString(LastFMConstants.APIKey)}&cb={Uri.EscapeDataString(LastFMConstants.CallbackURL)}")
                    .WithBounds(new LockedWindowBounds(1200, 720))
                    .WithPlatformBasedAdditions()
                    .WithSharedContext("LastFMSignIn", "")
                    .Show();

                signInWindow.ExecuteJavaScript(ScriptManager.CombinedScriptData);
                signInWindow.ExecuteJavaScript(Program.App.CurrentServerManager.Resolver.ReadFileAsText("/meta/lastfm/signin.js"));

                // Injected JavaScript will not survive redirects, therefore we need to poll for this
                while (IsWaitingForToken && signInWindow != null && Program.App.OpenWindows.Contains(signInWindow))
                {
                    await Task.Delay(2000);
                    signInWindow.ExecuteJavaScript(ScriptManager.CombinedScriptData + "\n\n" + Program.App.CurrentServerManager.Resolver.ReadFileAsText("/meta/lastfm/auth-check.js"));
                }
            });

        }

        [Command("recieveLastFMToken")]
        public static async Task RecieveLastFMToken(string token)
        {
            if (!IsWaitingForToken) return; // Prevents being called multiple times, the token can only be redeemed once
            IsWaitingForToken = false;

            // Redeem auth token into session key.
            // This writes through the main window's LocalStorage instance, which also
            // hydrates the JS side, so we only need to refresh the auth state in the UI here.
            await RedeemAuthToken(token);

            Program.MainWindow?.CallFunction("window.reloadLastFMAuthState");
        }

        [Command("logoutOfLastFM")]
        public static async Task LogOutOfLastFM()
        {
            var storage = Program.MainWindow?.LocalStorage;
            if (storage != null)
            {
                // Clear to "" rather than removing the keys: the JS-side hydrate only
                // overwrites keys present in the dictionary, so a removed key would keep
                // its stale value in the in-page cache and the UI would still look signed in.
                await storage.SetItem("lastfm_session_key", "");
                await storage.SetItem("lastfm_username", "");
            }

            Program.MainWindow?.CallFunction("window.reloadLastFMAuthState");
        }

        public static async Task RedeemAuthToken(string authToken)
        {
            // Implemented according to https://www.last.fm/api/show/auth.getSession
            var (sessionKey, username) = await LastFMHttpClient.Instance.GetSessionAsync(authToken);

            // Write through the main window's LocalStorage instance (not the static
            // LocalStorage.SetItem helpers, which create a throwaway instance with its own
            // cache). The window flushes its in-memory cache to disk on every JS-side write,
            // so keys written out-of-band via a separate instance get clobbered by the next
            // JS write (e.g. opening the Settings dialog), silently wiping the session and
            // stopping scrobbling. Saving through the window instance keeps its cache
            // consistent and hydrates the JS side at the same time.
            var storage = Program.MainWindow?.LocalStorage;
            if (storage == null) return;

            await storage.SetItem("lastfm_session_key", sessionKey);
            await storage.SetItem("lastfm_username", username);
        }
    }
}
