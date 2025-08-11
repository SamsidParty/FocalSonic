using System.Diagnostics.CodeAnalysis;

namespace SamsidParty.Subsonic.Proxy.AppleMusic.Types
{
    public class SongID
    {
        public required string PrimaryID;
        public required string CatalogID;

        [SetsRequiredMembers]
        public SongID(string formatted)
        {
            var split = formatted.Split(':');
            PrimaryID = split[1];
            CatalogID = split[2];
        }

        [SetsRequiredMembers]
        public SongID(string primaryID, string catalogID)
        {
            PrimaryID = primaryID;
            CatalogID = catalogID;
        }

        public string ToString()
        {
            return "applemusic:" + PrimaryID + ":" + CatalogID;
        }

        public static bool IsSongID(string id) => id.StartsWith("applemusic:");
        public static bool IsCatalogID(string id) => int.TryParse(id, out _);
    }
}
