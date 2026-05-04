using FocalSonic.AppleMusic;
using FocalSonic.AudioPlayer;
using IgniteView.Core;
using Newtonsoft.Json;
using SamsidParty.Subsonic.Common;
using SamsidParty.Subsonic.Common.Types;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace FocalSonic.Presence
{
    public class MediaPlaybackInfo
    {
        public static MediaPlaybackInfo Instance = new MediaPlaybackInfo(null);
        public PlayerStore Store;
        public AudioPlayer.AudioPlayer AssociatedPlayer => AudioPlayer.AudioPlayer.Instance;

        public MediaPlaybackInfo(PlayerStore store)
        {
            Store = store;
        }

        public Song? CurrentSong => Store?.State?.SongList?.CurrentSong;
        public int CurrentSongIndex => Store?.State?.SongList?.CurrentSongIndex ?? 0;
        public List<Song> Queue => Store?.State?.SongList?.CurrentList;
        public PlayerLoopState LoopState => Store?.State.PlayerState.LoopState ?? PlayerLoopState.Off;


        public bool IsPlaying { get { return Store?.State?.PlayerState?.IsPlaying ?? false; } set { if (Store != null) Store.State.PlayerState.IsPlaying = value; } }
        public TimeSpan Duration = TimeSpan.Zero;
        public TimeSpan Position = TimeSpan.Zero;


        // A combination of different values so that when this value changes, then the presence should be updated
        public string PresenceHash
        {
            get
            {
                if (CurrentSong == null || string.IsNullOrEmpty(CurrentSong.Title)) return "no-song";

                var timeHash = $"{(int)Position.TotalSeconds}-{(int)Duration.TotalSeconds}";
                if (AssociatedPlayer?.Speed != 1)
                {
                    // Custom speed will mess up calculations for position and duration, so just override the hash
                    timeHash = "speed-" + AssociatedPlayer?.Speed;
                }

                return $"song-{CurrentSong.Title}-{CurrentSong.Artist}-{CurrentSong.Album}-{IsPlaying}-{timeHash}-{Store?.State?.PresenceNonce}";
            }
        }

        public int? NextSongIndex
        {
            get
            {
                var nextSongIndex = CurrentSongIndex + 1;

                if (nextSongIndex > Queue?.Count - 1 && LoopState == PlayerLoopState.All)
                {
                    // Loop back to the first song if looping is enabled
                    nextSongIndex = 0;
                }
                if (nextSongIndex > Queue?.Count - 1) {
                    if (LoopState == PlayerLoopState.InfiniteRadio) return 0; // Tells the resolver to contact server for new track
                    // Playback finished, no next song
                    return null;
                }  

                return nextSongIndex;
            }
        }

        public int? PreviousSongIndex
        {
            get
            {
                if (LoopState == PlayerLoopState.InfiniteRadio) return -1; // Disallow previous song selection in radio loop mode

                var previousSongIndex = CurrentSongIndex - 1;

                if (previousSongIndex < 0 && LoopState == PlayerLoopState.All)
                {
                    // Loop back to the last song if looping is enabled
                    previousSongIndex = Queue.Count - 1;
                }
                if (previousSongIndex < 0) { return null; }  // Looping is disabled

                return previousSongIndex;
            }
        }

        public Song? NextQueueItem => Queue?[NextSongIndex ?? -1];
        public Song? PreviousQueueItem => Queue?[PreviousSongIndex ?? -1];

        public async Task NextSong(bool fromUserAction = true)
        {
            if (!fromUserAction && LoopState == PlayerLoopState.One)
            {
                // Loop
                await PlaySong(CurrentSong, CurrentSongIndex);
                return;
            }

            await PlaySong(await ResolveNextSong(), NextSongIndex);
        }

        // Similar to NextQueueItem, but supports radio stations
        public async Task<Song> ResolveNextSong()
        {
            var song = NextQueueItem;

            if ((song == null || NextSongIndex == 0) && LoopState == PlayerLoopState.InfiniteRadio && !string.IsNullOrEmpty(Store.State.SongList.CurrentRadioID))
            {
                // Ask apple servers what to play, ignore song and index params
                song = await AppleMusicRadioResolver.GetNextTrack(Store.State.SongList.CurrentRadioID);

                if (song == null) { return NextQueueItem; }

                // Overwrite the queue
                await PlayerStore.Mutate(async (s) =>
                {
                    s.State.SongList.CurrentList.Add(song);
                    s.State.SongList.OriginalList.Add(song);
                    s.State.SongList.ShuffledList.Add(song);
                    s.State.SongList.CurrentSongIndex = 0;
                    s.State.SongList.CurrentSong = song;
                });
            }

            return song;
        }

        public async Task PreviousSong(bool fromUserAction = true) => await PlaySong(PreviousQueueItem, PreviousSongIndex);

        public async Task PlaySong(Song? song, int? index)
        {
            if (song == null) { return; }

            // If we're at the end of the queue and in infinite radio mode, ensure the song is the only one in the queue
            if (index >= (Queue?.Count - 1) && LoopState == PlayerLoopState.InfiniteRadio && !string.IsNullOrEmpty(Store.State.SongList.CurrentRadioID))
            {
                // Ensure this song will be the only one in the queue
                await PlayerStore.Mutate(async (s) =>
                {
                    s.State.SongList.CurrentList = new List<Song> { song };
                    s.State.SongList.OriginalList = new List<Song> { song };
                    s.State.SongList.ShuffledList = new List<Song> { song };
                    s.State.SongList.CurrentSongIndex = 0;
                    s.State.SongList.CurrentSong = song;
                });

                index = 0;
            }


            // Modify the player store to reflect these changes
            await PlayerStore.Mutate(async (s) =>
            {
                s.State.SongList.CurrentSongIndex = index ?? 0;
                s.State.SongList.CurrentSong = song;
            });

            var playbackURL = Store.ExtraProperties.GetStreamURLForSong(song);


            await AssociatedPlayer.ResetSource();
            await AssociatedPlayer.SetSource(playbackURL, null);
            await AssociatedPlayer.UpdatePlaybackParameters();
            await Play();
        }

        public async Task Play()
        {
            await PlayerStore.Mutate(async (s) => s.State.PlayerState.IsPlaying = true);
            if (AssociatedPlayer != null) await AssociatedPlayer.PlayAudio();
        }

        public async Task Pause()
        {
            await PlayerStore.Mutate(async (s) => s.State.PlayerState.IsPlaying = false);
            if (AssociatedPlayer != null) await AssociatedPlayer.PauseAudio();
        }

        [Command("nextButtonPressed")]
        public static async Task NextButtonPressed() => await Instance.NextSong();

        [Command("previousButtonPressed")]
        public static async Task PreviousButtonPressed() => await Instance.PreviousSong();
    }
}
