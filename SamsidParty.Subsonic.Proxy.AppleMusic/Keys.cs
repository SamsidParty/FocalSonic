namespace SamsidParty.Subsonic.Proxy.AppleMusic
{
    public class Keys
    {
        public static string? AppleDeveloperToken;
        public static string? MediaUserToken;

        public static void Load()
        {
            AppleDeveloperToken = Environment.GetEnvironmentVariable("APPLE_DEVELOPER_TOKEN");
            MediaUserToken = Environment.GetEnvironmentVariable("MUSIC_USER_TOKEN");
        }
    }
}
