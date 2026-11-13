#if MACOS

using FocalSonic.AppleMusic;
using FocalSonic.Helpers;
using FocalSonic.Persistence;

namespace FocalSonic.MacOS
{
    /// <summary>
    /// Apple Music sign-in on macOS. WebKit won't hand MusicKit JS's tokens to an embedded
    /// music.apple.com, so instead of the web sign-in window:
    ///   - the developer token is read from music.apple.com's JavaScript (as on Windows, it's
    ///     the web player's token, just fetched directly),
    ///   - the user grants FocalSonic access to Apple Music in the system prompt, and
    ///   - native MusicKit mints the music user token for the account signed into the Mac.
    /// The rest of FocalSonic then uses both tokens exactly as it does elsewhere.
    /// </summary>
    public static class MusicKitSession
    {
        const string ErrorTitle = "Apple Music";

        /// <summary>Runs when the user presses "Connect Apple Music".</summary>
        public static async Task SignIn()
        {
            try
            {
                var helper = MacHelper.Instance;

                // Shows the system's Apple Music permission prompt the first time.
                var authorization = await helper.Send("authorize", new { request = true }, TimeSpan.FromMinutes(10));
                if (authorization.Value<string>("status") != "authorized")
                {
                    ErrorHandler.DisplayError(ErrorTitle, "FocalSonic needs access to Apple Music. Allow it in System Settings > Privacy & Security > Media & Apple Music, then try again.");
                    return;
                }

                var subscription = await helper.Send("subscription");
                if (subscription.Value<bool?>("canPlayCatalogContent") == false)
                {
                    ErrorHandler.DisplayError(ErrorTitle, "The Apple Account signed into this Mac doesn't have an active Apple Music subscription, so songs won't play.");
                }

                var developerToken = await AppleMusicDeveloperToken.FetchAsync();
                await helper.Send("configure", new { developerToken });
                var userToken = (await helper.Send("userToken", new { ignoreCache = true })).Value<string>("token");

                if (string.IsNullOrEmpty(userToken))
                {
                    throw new Exception("MusicKit didn't return a user token");
                }

                // A player whose session failed to restore would hand that failure to the
                // reloaded page; it makes a fresh one, as after logging out.
                await AudioPlayer.AudioPlayer.DisposeAudioPlayers();
                await AppleMusicAudioPlayer.AppleMusicSignInRecieveToken(userToken, developerToken);
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine("Apple Music sign in failed: " + ex);
                ErrorHandler.DisplayError(ErrorTitle, "Couldn't sign in to Apple Music: " + ex.Message);
            }
        }

        /// <summary>
        /// Picks a saved session back up: refreshes the developer token if it's close to
        /// expiring, hands it to MusicKit and re-mints the user token. False means the user has
        /// to sign in (again).
        /// </summary>
        public static async Task<bool> Restore(MacHelper helper)
        {
            AppleMusicAudioPlayer.LoadKeys();
            if (string.IsNullOrEmpty(AppleMusicKeys.MediaUserToken)) return false;

            var developerToken = await AppleMusicDeveloperToken.EnsureFreshAsync(AppleMusicKeys.AppleDeveloperToken);
            if (developerToken != AppleMusicKeys.AppleDeveloperToken)
            {
                AppleMusicAudioPlayer.SaveDeveloperKey(developerToken);
            }

            await helper.Send("configure", new { developerToken });

            // Signed in, but this copy of FocalSonic was never given access (a fresh install, or
            // the first run of a new build): ask now, the loading screen covers the wait.
            var status = (await helper.Send("authorize", new { request = false })).Value<string>("status");
            if (status == "notDetermined")
            {
                status = (await helper.Send("authorize", new { request = true }, TimeSpan.FromMinutes(10))).Value<string>("status");
            }

            if (status != "authorized")
            {
                ErrorHandler.DisplayError(ErrorTitle, "FocalSonic needs access to Apple Music. Allow it in System Settings > Privacy & Security > Media & Apple Music, then reopen FocalSonic.");
                return false;
            }

            // Keeps the API token current (web tokens from an older sign-in expire). A failure
            // here isn't fatal: the saved token may well still be valid.
            try
            {
                var userToken = (await helper.Send("userToken")).Value<string>("token");
                if (!string.IsNullOrEmpty(userToken) && userToken != AppleMusicKeys.MediaUserToken)
                {
                    var credentials = ServerCredential.GetCurrent();
                    credentials.Password = userToken;
                    credentials.Save();
                    AppleMusicAudioPlayer.LoadKeys();
                }
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine("Couldn't refresh the Apple Music user token: " + ex.Message);
            }

            return true;
        }
    }
}

#endif
