namespace SamsidParty.Subsonic.Proxy.AppleMusic
{
    public class AppleMusicHttpClient : HttpClient
    {
        public static AppleMusicHttpClient Instance = new AppleMusicHttpClient();

        public AppleMusicHttpClient()
        {
            this.BaseAddress = new Uri("https://amp-api.music.apple.com/v1/");
        }

    }
}
