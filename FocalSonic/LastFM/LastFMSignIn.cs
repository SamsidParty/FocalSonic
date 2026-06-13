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

            // Redeem auth token into session key
            await RedeemAuthToken(token);

            // Callbacks
            // GetAllItems is async; await it so the resolved dictionary is hydrated, not the Task object
            var items = await LocalStorage.GetAllItems("default");
            Program.MainWindow?.CallFunction("window._localStorage.hydrate", items); // Reload localStorage
            Program.MainWindow?.CallFunction("window.reloadLastFMAuthState");
        }

        [Command("logoutOfLastFM")]
        public static async Task LogOutOfLastFM()
        {
            // Await the writes so the cleared values are persisted before we read them back
            await LocalStorage.SetItem("lastfm_session_key", "", "default");
            await LocalStorage.SetItem("lastfm_username", "", "default");

            var items = await LocalStorage.GetAllItems("default");
            Program.MainWindow?.CallFunction("window._localStorage.hydrate", items); // Reload localStorage
            Program.MainWindow?.CallFunction("window.reloadLastFMAuthState");
        }

        public static async Task RedeemAuthToken(string authToken)
        {
            // Implemented according to https://www.last.fm/api/show/auth.getSession
            var (sessionKey, username) = await LastFMHttpClient.Instance.GetSessionAsync(authToken);

            // Await the writes so they are persisted before GetAllItems reads them back in RecieveLastFMToken
            await LocalStorage.SetItem("lastfm_session_key", sessionKey, "default");
            await LocalStorage.SetItem("lastfm_username", username, "default");
        }
    }
}
