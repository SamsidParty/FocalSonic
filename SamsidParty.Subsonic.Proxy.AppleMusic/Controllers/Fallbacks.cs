using Microsoft.AspNetCore.Mvc;
using SamsidParty.Subsonic.Common;

namespace SamsidParty.Subsonic.Proxy.AppleMusic.Controllers
{
    public partial class AppleMusicRequestImplementation : Subsonic.Common.IController
    {
        public Task<SubsonicResponse> ChangePasswordAsync(string username, string password)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> CreateBookmarkAsync(string id, int position, string comment)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> CreateInternetRadioStationAsync(string streamUrl, string name, string homepageUrl)
        {
            throw new NotImplementedException();
        }

        public Task<CreatePlaylistResponse> CreatePlaylistAsync(string playlistId, string name, IEnumerable<string> songId)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> CreatePodcastChannelAsync(string url)
        {
            throw new NotImplementedException();
        }

        public Task<CreateSharesResponse> CreateShareAsync(IEnumerable<string> id, string description, int? expires)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> CreateUserAsync(string username, string password, string email, bool ldapAuthenticated, bool adminRole, bool settingsRole, bool streamRole, bool jukeboxRole, bool downloadRole, bool uploadRole, bool playlistRole, bool coverArtRole, bool commentRole, bool podcastRole, bool shareRole, bool videoConversionRole, IEnumerable<string> musicFolderId)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> DeleteBookmarkAsync(string id)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> DeleteInternetRadioStationAsync(string id)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> DeletePlaylistAsync(string id)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> DeletePodcastChannelAsync(string id)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> DeletePodcastEpisodeAsync(string id)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> DeleteShareAsync(string id)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> DeleteUserAsync(string username)
        {
            throw new NotImplementedException();
        }

        public Task<FileResult> DownloadAsync(string id)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> DownloadPodcastEpisodeAsync(string id)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> GetAddChatMessageAsync(string message)
        {
            throw new NotImplementedException();
        }


        public Task<GetAlbumInfoResponse> GetAlbumInfo2Async(string id)
        {
            throw new NotImplementedException();
        }

        public Task<GetAlbumInfoResponse> GetAlbumInfoAsync(string id)
        {
            throw new NotImplementedException();
        }

        public Task<GetArtistResponse> GetArtistAsync(string id)
        {
            throw new NotImplementedException();
        }

        public Task<GetArtistInfo2Response> GetArtistInfo2Async(string id, int count, bool includeNotPresent)
        {
            throw new NotImplementedException();
        }

        public Task<GetArtistInfoResponse> GetArtistInfoAsync(string id, int count, bool includeNotPresent)
        {
            throw new NotImplementedException();
        }

        public Task<GetArtistsResponse> GetArtistsAsync(string musicFolderId)
        {
            throw new NotImplementedException();
        }

        public Task<FileResult> GetAvatarAsync(string username)
        {
            throw new NotImplementedException();
        }

        public Task<GetBookmarksResponse> GetBookmarksAsync()
        {
            throw new NotImplementedException();
        }

        public Task<FileResult> GetCaptionsAsync(string id, Format? format)
        {
            throw new NotImplementedException();
        }

        public Task<GetChatMessagesResponse> GetChatMessagesAsync()
        {
            throw new NotImplementedException();
        }

        public Task<GetGenresResponse> GetGenresAsync()
        {
            throw new NotImplementedException();
        }

        public Task<GetIndexesResponse> GetIndexesAsync(string musicFolderId, int? ifModifiedSince)
        {
            throw new NotImplementedException();
        }

        public Task<GetInternetRadioStationsResponse> GetInternetRadioStationsAsync()
        {
            throw new NotImplementedException();
        }

        public Task<GetLicenseResponse> GetLicenseAsync()
        {
            throw new NotImplementedException();
        }

        public Task<GetLyricsResponse> GetLyricsAsync(string artist, string title)
        {
            throw new NotImplementedException();
        }

        public Task<GetLyricsBySongIdResponse> GetLyricsBySongIdAsync(string id)
        {
            throw new NotImplementedException();
        }

        public Task<GetMusicDirectoryResponse> GetMusicDirectoryAsync(string id)
        {
            throw new NotImplementedException();
        }

        public Task<GetMusicFoldersResponse> GetMusicFoldersAsync()
        {
            throw new NotImplementedException();
        }

        public Task<GetNewestPodcastsResponse> GetNewestPodcastsAsync(int count)
        {
            throw new NotImplementedException();
        }

        public Task<GetNowPlayingResponse> GetNowPlayingAsync()
        {
            throw new NotImplementedException();
        }

        public Task<GetOpenSubsonicExtensionsResponse> GetOpenSubsonicExtensionsAsync()
        {
            throw new NotImplementedException();
        }

        public Task<GetPlayQueueResponse> GetPlayQueueAsync()
        {
            throw new NotImplementedException();
        }

        public Task<GetPlayQueueByIndexResponse> GetPlayQueueByIndexAsync()
        {
            throw new NotImplementedException();
        }

        public Task<GetPodcastEpisodeResponse> GetPodcastEpisodeAsync(string id)
        {
            throw new NotImplementedException();
        }

        public Task<GetPodcastsResponse> GetPodcastsAsync(string id, bool includeEpisodes)
        {
            throw new NotImplementedException();
        }

        public Task<GetRandomSongsResponse> GetRandomSongsAsync(int size, string genre, int? fromYear, int? toYear, string musicFolderId)
        {
            throw new NotImplementedException();
        }

        public Task<GetScanStatusResponse> GetScanStatusAsync()
        {
            throw new NotImplementedException();
        }

        public Task<GetSharesResponse> GetSharesAsync()
        {
            throw new NotImplementedException();
        }

        public Task<GetSimilarSongs2Response> GetSimilarSongs2Async(string id, int count)
        {
            throw new NotImplementedException();
        }

        public Task<GetSimilarSongsResponse> GetSimilarSongsAsync(string id, int count)
        {
            throw new NotImplementedException();
        }

        public Task<GetSongResponse> GetSongAsync(string id)
        {
            throw new NotImplementedException();
        }

        public Task<GetSongsByGenreResponse> GetSongsByGenreAsync(string genre, int count, int offset, string musicFolderId)
        {
            throw new NotImplementedException();
        }

        public Task<GetStarred2Response> GetStarred2Async(string musicFolderId)
        {
            throw new NotImplementedException();
        }

        public Task<GetStarredResponse> GetStarredAsync(string musicFolderId)
        {
            throw new NotImplementedException();
        }

        public Task<GetTopSongsResponse> GetTopSongsAsync(string id, int count)
        {
            throw new NotImplementedException();
        }

        public Task<GetUserResponse> GetUserAsync(string username)
        {
            throw new NotImplementedException();
        }

        public Task<GetUsersResponse> GetUsersAsync()
        {
            throw new NotImplementedException();
        }

        public Task<GetVideoInfoResponse> GetVideoInfoAsync(string id)
        {
            throw new NotImplementedException();
        }

        public Task<GetVideosResponse> GetVideosAsync()
        {
            throw new NotImplementedException();
        }

        public Task<string> Hls_m3u8Async(string id, int? bitRate, string audioTrack)
        {
            throw new NotImplementedException();
        }

        public Task<JukeboxControlResponse> JukeboxControlAsync(JukeboxAction action, int? index, int? offset, IEnumerable<string> id, float? gain)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> PostAddChatMessageAsync(Body body)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> PostChangePasswordAsync(Body2 body)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> PostCreateBookmarkAsync(Body3 body)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> PostCreateInternetRadioStationAsync(Body4 body)
        {
            throw new NotImplementedException();
        }

        public Task<CreatePlaylistResponse> PostCreatePlaylistAsync(Body5 body)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> PostCreatePodcastChannelAsync(Body6 body)
        {
            throw new NotImplementedException();
        }

        public Task<CreateSharesResponse> PostCreateShareAsync(Body7 body)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> PostCreateUserAsync(Body8 body)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> PostDeleteBookmarkAsync(Body9 body)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> PostDeleteInternetRadioStationAsync(Body10 body)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> PostDeletePlaylistAsync(Body11 body)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> PostDeletePodcastChannelAsync(Body12 body)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> PostDeletePodcastEpisodeAsync(Body13 body)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> PostDeleteShareAsync(Body14 body)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> PostDeleteUserAsync(Body15 body)
        {
            throw new NotImplementedException();
        }

        public Task<FileResult> PostDownloadAsync(Body16 body)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> PostDownloadPodcastEpisodeAsync(Body17 body)
        {
            throw new NotImplementedException();
        }

        public Task<GetAlbumResponse> PostGetAlbumAsync(Body18 body)
        {
            throw new NotImplementedException();
        }

        public Task<GetAlbumInfoResponse> PostGetAlbumInfo2Async(Body20 body)
        {
            throw new NotImplementedException();
        }

        public Task<GetAlbumInfoResponse> PostGetAlbumInfoAsync(Body19 body)
        {
            throw new NotImplementedException();
        }

        public Task<GetAlbumList2Response> PostGetAlbumList2Async(Body22 body)
        {
            throw new NotImplementedException();
        }

        public Task<GetAlbumListResponse> PostGetAlbumListAsync(Body21 body)
        {
            throw new NotImplementedException();
        }

        public Task<GetArtistResponse> PostGetArtistAsync(Body23 body)
        {
            throw new NotImplementedException();
        }

        public Task<GetArtistInfo2Response> PostGetArtistInfo2Async(Body25 body)
        {
            throw new NotImplementedException();
        }

        public Task<GetArtistInfoResponse> PostGetArtistInfoAsync(Body24 body)
        {
            throw new NotImplementedException();
        }

        public Task<GetArtistsResponse> PostGetArtistsAsync(Body26 body)
        {
            throw new NotImplementedException();
        }

        public Task<FileResult> PostGetAvatarAsync(Body27 body)
        {
            throw new NotImplementedException();
        }

        public Task<GetBookmarksResponse> PostGetBookmarksAsync(object body)
        {
            throw new NotImplementedException();
        }

        public Task<FileResult> PostGetCaptionsAsync(Body28 body)
        {
            throw new NotImplementedException();
        }

        public Task<GetChatMessagesResponse> PostGetChatMessagesAsync(object body)
        {
            throw new NotImplementedException();
        }

        public Task<FileResult> PostGetCoverArtAsync(Body29 body)
        {
            throw new NotImplementedException();
        }

        public Task<GetGenresResponse> PostGetGenresAsync(object body)
        {
            throw new NotImplementedException();
        }

        public Task<GetIndexesResponse> PostGetIndexesAsync(Body30 body)
        {
            throw new NotImplementedException();
        }

        public Task<GetInternetRadioStationsResponse> PostGetInternetRadioStationsAsync(object body)
        {
            throw new NotImplementedException();
        }

        public Task<GetLicenseResponse> PostGetLicenseAsync(object body)
        {
            throw new NotImplementedException();
        }

        public Task<GetLyricsResponse> PostGetLyricsAsync(Body31 body)
        {
            throw new NotImplementedException();
        }

        public Task<GetLyricsBySongIdResponse> PostGetLyricsBySongIdAsync(Body32 body)
        {
            throw new NotImplementedException();
        }

        public Task<GetMusicDirectoryResponse> PostGetMusicDirectoryAsync(Body33 body)
        {
            throw new NotImplementedException();
        }

        public Task<GetMusicFoldersResponse> PostGetMusicFoldersAsync(object body)
        {
            throw new NotImplementedException();
        }

        public Task<GetNewestPodcastsResponse> PostGetNewestPodcastsAsync(Body34 body)
        {
            throw new NotImplementedException();
        }

        public Task<GetNowPlayingResponse> PostGetNowPlayingAsync(object body)
        {
            throw new NotImplementedException();
        }

        public Task<GetOpenSubsonicExtensionsResponse> PostGetOpenSubsonicExtensionsAsync(object body)
        {
            throw new NotImplementedException();
        }

        public Task<GetPlaylistResponse> PostGetPlaylistAsync(Body35 body)
        {
            throw new NotImplementedException();
        }

        public Task<GetPlaylistsResponse> PostGetPlaylistsAsync(Body36 body)
        {
            throw new NotImplementedException();
        }

        public Task<GetPlayQueueResponse> PostGetPlayQueueAsync(object body)
        {
            throw new NotImplementedException();
        }

        public Task<GetPlayQueueByIndexResponse> PostGetPlayQueueByIndexAsync(object body)
        {
            throw new NotImplementedException();
        }

        public Task<GetPodcastEpisodeResponse> PostGetPodcastEpisodeAsync(Body37 body)
        {
            throw new NotImplementedException();
        }

        public Task<GetPodcastsResponse> PostGetPodcastsAsync(Body38 body)
        {
            throw new NotImplementedException();
        }

        public Task<GetRandomSongsResponse> PostGetRandomSongsAsync(Body39 body)
        {
            throw new NotImplementedException();
        }

        public Task<GetScanStatusResponse> PostGetScanStatusAsync(object body)
        {
            throw new NotImplementedException();
        }

        public Task<GetSharesResponse> PostGetSharesAsync(object body)
        {
            throw new NotImplementedException();
        }

        public Task<GetSimilarSongs2Response> PostGetSimilarSongs2Async(Body41 body)
        {
            throw new NotImplementedException();
        }

        public Task<GetSimilarSongsResponse> PostGetSimilarSongsAsync(Body40 body)
        {
            throw new NotImplementedException();
        }

        public Task<GetSongResponse> PostGetSongAsync(Body42 body)
        {
            throw new NotImplementedException();
        }

        public Task<GetSongsByGenreResponse> PostGetSongsByGenreAsync(Body43 body)
        {
            throw new NotImplementedException();
        }

        public Task<GetStarred2Response> PostGetStarred2Async(object body)
        {
            throw new NotImplementedException();
        }

        public Task<GetStarredResponse> PostGetStarredAsync(object body)
        {
            throw new NotImplementedException();
        }

        public Task<GetTopSongsResponse> PostGetTopSongsAsync(Body44 body)
        {
            throw new NotImplementedException();
        }

        public Task<GetUserResponse> PostGetUserAsync(Body45 body)
        {
            throw new NotImplementedException();
        }

        public Task<GetUsersResponse> PostGetUsersAsync(object body)
        {
            throw new NotImplementedException();
        }

        public Task<GetVideoInfoResponse> PostGetVideoInfoAsync(Body46 body)
        {
            throw new NotImplementedException();
        }

        public Task<GetVideosResponse> PostGetVideosAsync(object body)
        {
            throw new NotImplementedException();
        }

        public Task<string> PostHls_m3u8Async(Body47 body)
        {
            throw new NotImplementedException();
        }

        public Task<JukeboxControlResponse> PostJukeboxControlAsync(Body48 body)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> PostPingAsync(object body)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> PostRefreshPodcastsAsync(object body)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> PostSavePlayQueueAsync(Body49 body)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> PostSavePlayQueueByIndexAsync(Body50 body)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> PostScrobbleAsync(Body51 body)
        {
            throw new NotImplementedException();
        }

        public Task<Search2Response> PostSearch2Async(Body53 body)
        {
            throw new NotImplementedException();
        }

        public Task<Search3Response> PostSearch3Async(Body54 body)
        {
            throw new NotImplementedException();
        }

        public Task<SearchResponse> PostSearchAsync(Body52 body)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> PostSetRatingAsync(Body55 body)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> PostStarAsync(Body56 body)
        {
            throw new NotImplementedException();
        }

        public Task<StartScanResponse> PostStartScanAsync(object body)
        {
            throw new NotImplementedException();
        }

        public Task<FileResult> PostStreamAsync(Body57 body)
        {
            throw new NotImplementedException();
        }

        public Task<GetTokenInfoResponse> PostTokenInfoAsync(object body)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> PostUnstarAsync(Body58 body)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> PostUpdateInternetRadioStationAsync(Body59 body)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> PostUpdatePlaylistAsync(Body60 body)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> PostUpdateShareAsync(Body61 body)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> PostUpdateUserAsync(Body62 body)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> RefreshPodcastsAsync()
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> SavePlayQueueAsync(string id, string current, int? position)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> SavePlayQueueByIndexAsync(string id, int? currentIndex, int? position)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> ScrobbleAsync(string id, int? time, bool submission)
        {
            throw new NotImplementedException();
        }

        public Task<Search2Response> Search2Async(string query, int artistCount, int artistOffset, int albumCount, int albumOffset, int songCount, int songOffset, string musicFolderId)
        {
            throw new NotImplementedException();
        }

        public Task<Search3Response> Search3Async(string query, int artistCount, int artistOffset, int albumCount, int albumOffset, int songCount, int songOffset, string musicFolderId)
        {
            throw new NotImplementedException();
        }

        public Task<SearchResponse> SearchAsync(string artist, string album, string title, bool? any, int count, int offset, int? newerThan)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> SetRatingAsync(string id, int rating)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> StarAsync(IEnumerable<string> id, IEnumerable<string> albumId, IEnumerable<string> artistId)
        {
            throw new NotImplementedException();
        }

        public Task<StartScanResponse> StartScanAsync()
        {
            throw new NotImplementedException();
        }

        public async Task<FileResult> StreamAsync(string id, int? maxBitRate, string format, int? timeOffset, string size, bool estimateContentLength, bool converted)
        {
            return new FileContentResult(new byte[0], "audio/mp3");
        }

        public Task<GetTokenInfoResponse> TokenInfoAsync()
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> UnstarAsync(IEnumerable<string> id, IEnumerable<string> albumId, IEnumerable<string> artistId)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> UpdateInternetRadioStationAsync(string id, string streamUrl, string name, string homepageUrl)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> UpdatePlaylistAsync(string playlistId, string name, string comment, bool? @public, IEnumerable<string> songIdToAdd, IEnumerable<int> songIndexToRemove)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> UpdateShareAsync(string id, string description, int? expires)
        {
            throw new NotImplementedException();
        }

        public Task<SubsonicResponse> UpdateUserAsync(string username, string password, string email, bool ldapAuthenticated, bool adminRole, bool settingsRole, bool streamRole, bool jukeboxRole, bool downloadRole, bool uploadRole, bool coverArtRole, bool commentRole, bool podcastRole, bool shareRole, bool videoConversionRole, IEnumerable<string> musicFolderId, MaxBitRate? maxBitRate)
        {
            throw new NotImplementedException();
        }
    }
}
