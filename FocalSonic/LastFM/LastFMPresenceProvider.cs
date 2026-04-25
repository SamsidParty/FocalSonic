using FocalSonic.Presence;
using IgniteView.Core;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FocalSonic.LastFM
{
    public class LastFMPresenceProvider : PresenceProvider
    {
        public bool IsEnabled
        {
            get
            {
                try
                {
                    return !string.IsNullOrEmpty(LocalStorage.GetItem("lastfm_session_key", "default").Result);
                }
                catch {  }
                
                return false;
            }
        }

        // UpdateMediaStatus will be called with the same song id multiple times as long as the presence hash is different
        // Use internal logic to make sure it's only called once per song, we do not care about syncing timestamp data
        public string? LastSongID;

        public override async Task UpdateMediaStatus(MediaPlaybackInfo playbackInfo)
        {
            if (!IsEnabled || playbackInfo?.CurrentSong == null || playbackInfo?.CurrentSong?.Id == LastSongID) return;
            LastSongID = playbackInfo!.CurrentSong?.Id;

            var request = new Dictionary<string, string>();
            request["artist"] = playbackInfo.CurrentSong!.Artist;
            request["track"] = playbackInfo.CurrentSong!.Title;
            request["album"] = playbackInfo.CurrentSong!.Album;

            if (playbackInfo.Duration.TotalSeconds > 0) request["duration"] = playbackInfo.Duration.TotalSeconds.ToString();
            if (playbackInfo.CurrentSong.Track >= 0) request["trackNumber"] = playbackInfo.CurrentSong!.Track.ToString();

            // Send to the API
            var response = await LastFMHttpClient.Instance.CallAPIAsync("track.updateNowPlaying", request);
        }

        public override async Task Scrobble(MediaPlaybackInfo playbackInfo)
        {
            if (!IsEnabled || playbackInfo?.CurrentSong == null || playbackInfo!.Duration.TotalSeconds < 30) return;

            var request = new Dictionary<string, string>();
            request["artist[0]"] = playbackInfo.CurrentSong!.Artist;
            request["track[0]"] = playbackInfo.CurrentSong!.Title;
            request["album[0]"] = playbackInfo.CurrentSong!.Album;
            request["timestamp[0]"] = ((DateTimeOffset)(DateTime.UtcNow - playbackInfo.Position)).ToUnixTimeSeconds().ToString();
            request["duration[0]"] = playbackInfo.Duration.TotalSeconds.ToString();

            if (playbackInfo.CurrentSong.Track >= 0) request["trackNumber[0]"] = playbackInfo.CurrentSong!.Track.ToString();

            // Send to the API
            var response = await LastFMHttpClient.Instance.CallAPIAsync("track.scrobble", request);
        }
    }
}
