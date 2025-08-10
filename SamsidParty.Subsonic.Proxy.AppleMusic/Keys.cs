namespace SamsidParty.Subsonic.Proxy.AppleMusic
{
    public class Keys
    {
        public static string? AppleDeveloperToken;
        public static string? MusicUserToken;

        public static void Load()
        {
            AppleDeveloperToken = Environment.GetEnvironmentVariable("APPLE_DEVELOPER_TOKEN");
            MusicUserToken = Environment.GetEnvironmentVariable("MUSIC_USER_TOKEN");
        }
    }
}
