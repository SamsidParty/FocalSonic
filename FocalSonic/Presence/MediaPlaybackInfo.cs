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

        public MediaPlaybackInfo(PlayerStore store)
        {
            Store = store;
        }

        public Song? CurrentSong => Store?.State?.SongList?.CurrentSong;
        public int CurrentSongIndex => Store?.State?.SongList?.CurrentSongIndex ?? 0;
        public List<Song> Queue => Store?.State?.SongList?.CurrentList;
        public PlayerLoopState LoopState => Store?.State.PlayerState.LoopState ?? PlayerLoopState.Off;


        public bool IsPlaying = false;
        public TimeSpan Duration = TimeSpan.Zero;
        public TimeSpan Position = TimeSpan.Zero;
    }
}
