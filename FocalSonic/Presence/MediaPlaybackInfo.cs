using IgniteView.Core;
using Newtonsoft.Json;
using SamsidParty.Subsonic.Common.Types;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using FocalSonic.AudioPlayer;

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

        public int? NextSongIndex
        {
            get
            {
                var nextSongIndex = CurrentSongIndex + 1;

                if (nextSongIndex > Queue.Count - 1 && LoopState == PlayerLoopState.All)
                {
                    // Loop back to the first song if looping is enabled
                    nextSongIndex = 0;
                }
                if (nextSongIndex > Queue.Count - 1) { return null; }  // Playback finished, no next song

                return nextSongIndex;
            }
        }

        public int? PreviousSongIndex
        {
            get
            {
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

        public async Task NextSong() => await PlaySong(NextQueueItem, NextSongIndex);
        public async Task PreviousSong() => await PlaySong(PreviousQueueItem, PreviousSongIndex);

        public async Task PlaySong(Song? song, int? index)
        {
            if (song == null) { return; }

            // Modify the player store to reflect these changes
            await PlayerStore.Mutate(async (s) =>
            {
                s.State.SongList.CurrentSongIndex = index ?? 0;
                s.State.SongList.CurrentSong = song;
            });

            var playbackURL = Store.ExtraProperties.GetStreamURLForSong(song.Id);

            await AssociatedPlayer.SetSource(playbackURL, null);
            await AssociatedPlayer.UpdatePlaybackParameters();
            await AssociatedPlayer.PlayAudio();
        }

        public async Task Play()
        {
            await AssociatedPlayer.PlayAudio();
        }

        public async Task Pause()
        {
            await AssociatedPlayer.PauseAudio();
        }
    }
}
