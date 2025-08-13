

using System.Security.Cryptography;

namespace SamsidParty.Subsonic.Proxy.AppleMusic
{
    public class AppleMusicKeys
    {
        // Contant address, hopefully no port conflicts will happen
        public static string? ServerAddress = "http://localhost:45896";

        public static string? AppleDeveloperToken;
        public static string? MediaUserToken;
        public static string? Region = "us";

        // Randomly generated keys for proxy authentication
        public static string? ProxyUsername;
        public static string? ProxyPassword;

        public static string RandomString(int length)
        {
            string allowedChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            char[] randomChars = new char[length];

            for (int i = 0; i < length; i++)
            {
                randomChars[i] = allowedChars[RandomNumberGenerator.GetInt32(0, allowedChars.Length)];
            }

            return new string(randomChars);
        }
    }
}
