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
        // This key and callback server belong to SamsidParty
        // Derivatives of FocalSonic not affiliated with SamsidParty should change these
        const string APIKey = "7746ab31f725273e9ae23f25b1e29e12";
        const string CallbackURL = "https://samsidparty.com/Services/focalsonic/integrations/lastfm.php";

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
                    .WithURL($"https://www.last.fm/api/auth?api_key={Uri.EscapeDataString(APIKey)}&cb={Uri.EscapeDataString(CallbackURL)}")
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
            IsWaitingForToken = false;

            // Redeem auth token into session key
            await RedeemAuthToken(token);

            var username = LocalStorage.GetItem("lastfm_username", "default"); ;
            Console.WriteLine(username);
        }

        public static async Task RedeemAuthToken(string authToken)
        {
            // TODO: Implement this based on https://www.last.fm/api/show/auth.getSession
            // Use LastFMHttpClient to make the request, and then store the session key and username

            var sessionKey = "placeholder";
            var username = "placeholder";

            LocalStorage.SetItem("lastfm_session_key", sessionKey, "default");
            LocalStorage.SetItem("lastfm_username", username, "default");
        }
    }
}
