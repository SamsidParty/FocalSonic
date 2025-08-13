using Mapster;
using Newtonsoft.Json;
using SamsidParty.Subsonic.Common;
using SamsidParty.Subsonic.Proxy.AppleMusic.Types;
using System.Drawing;
using System.Dynamic;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace SamsidParty.Subsonic.Proxy.AppleMusic.Controllers
{
    public partial class AppleMusicRequestImplementation : Subsonic.Common.IController
    {
        public async Task<AppleMusic.Types.SearchResults> SearchBase(string query, int artistCount, int artistOffset, int albumCount, int albumOffset, int songCount, int songOffset, string musicFolderId)
        {
            // Ignore the client and set the count to what apple music wants lol
            var totalLimit = 25;

            var types = new List<string>();
            if (artistCount > 0) types.Add("artists");
            if (albumCount > 0) types.Add("albums");
            if (songCount > 0) types.Add("songs");

            var url = $"catalog/{AppleMusicKeys.Region}/search?types={string.Join(",", types)}&term={Uri.EscapeDataString(query)}&limit={totalLimit}&offset={songOffset}";

            if (query.StartsWith("library:"))
            {
                query = query.Substring("library:".Length);
                url = $"me/library/search?types={string.Join(",", types.Select((t) => $"library-{t}"))}&term={Uri.EscapeDataString(query)}&limit={totalLimit}&offset={songOffset}";
            }

            return (await AppleMusicHttpClient.SendRequest<AppleMusic.Types.SearchResponse>(url))!.Results;
        }


        public async Task<Search2Response> Search2Async(string query, int artistCount, int artistOffset, int albumCount, int albumOffset, int songCount, int songOffset, string musicFolderId)
        {
            var results = (await SearchBase(query, artistCount, artistOffset, albumCount, albumOffset, songCount, songOffset, musicFolderId));
            var response = GetDefaultResponse().Adapt<Search2SuccessResponse>();
            response.SearchResult2 = new SearchResult2();
            response.SearchResult2.Song = (results.Songs?.Data.Count) > 0 ? results.Songs?.Data.Select((s) => s.ToSubsonicType()).ToList() : null;
            response.SearchResult2.Album = (results.Albums?.Data.Count) > 0 ? results.Albums?.Data.Select((s) => s.ToSubsonicType()).ToList() : null;

            return new Search2Response() { SubsonicResponse = response };
        }

        public async Task<Search3Response> Search3Async(string query, int artistCount, int artistOffset, int albumCount, int albumOffset, int songCount, int songOffset, string musicFolderId)
        {
            var results = (await SearchBase(query, artistCount, artistOffset, albumCount, albumOffset, songCount, songOffset, musicFolderId));
            var response = GetDefaultResponse().Adapt<Search3SuccessResponse>();
            response.SearchResult3 = new SearchResult3();
            response.SearchResult3.Song = (results.Songs?.Data.Count > 0) ? results.Songs?.Data.Select((s) => s.ToSubsonicType()).ToList() : null;
            response.SearchResult3.Album = (results.Albums?.Data.Count > 0) ? results.Albums?.Data.Select((s) => s.ToSubsonicTypeID3()).ToList() : null;

            return new Search3Response() { SubsonicResponse = response };
        }
    }
}
