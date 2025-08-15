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

        public async Task NextSong()
        {
            // Skip to the next song in the queue
            var nextSongIndex = CurrentSongIndex + 1;
            var nextQueueItem = Queue.ElementAtOrDefault(nextSongIndex);

            if (nextQueueItem == null && LoopState == PlayerLoopState.All)
            {
                nextQueueItem = Queue.FirstOrDefault(); // Loop back to the first song if looping is enabled
                nextSongIndex = 0;
            }
            if (nextQueueItem == null) { return; }  // Playback finished, do nothing

            // Modify the player store to reflect these changes
            var playerStore = JsonConvert.DeserializeObject<PlayerStore>(await PlayerStore.GetPlayerStore());
            playerStore.State.SongList.CurrentSongIndex = nextSongIndex;
            playerStore.State.SongList.CurrentSong = nextQueueItem;
            await PlayerStore.SetPlayerStore(JsonConvert.SerializeObject(playerStore));

            var playbackURL = Store.ExtraProperties.GetStreamURLForSong(nextQueueItem.Id);

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
