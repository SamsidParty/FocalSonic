#if MACOS

using FocalSonic.AppleMusic;
using FocalSonic.Helpers;
using FocalSonic.OverrideSystem;
using FocalSonic.Presence;
using IgniteView.Core;
using Newtonsoft.Json.Linq;

namespace FocalSonic.MacOS
{
    /// <summary>
    /// Apple Music playback through native MusicKit, standing in for the hidden
    /// music.apple.com window <see cref="AppleMusicAudioPlayer"/> uses on Windows and Linux.
    /// Like the web player, MusicKit only ever gets the current track: the queue stays in
    /// FocalSonic, and when a track ends the helper says so and the next one is loaded.
    /// The system's media controls are FocalSonic's own (see <see cref="MacNowPlayingProvider"/>)
    /// whenever the helper manages to switch MusicKit's off (<see cref="OwnsNowPlaying"/>).
    /// </summary>
    public class MusicKitAudioPlayer : AudioPlayer.AudioPlayer, IAppleMusicPlayer
    {
        public string LoadStatus { get; private set; } = "loading";

        /// <summary>
        /// MusicKit's own Now Playing entry (and with it the media keys, Control Center and
        /// AirPods) is switched off, so FocalSonic publishes its own, as on Windows.
        /// </summary>
        public bool OwnsNowPlaying { get; private set; }
        public override string ChromecastCredential => AppleMusicKeys.MediaUserToken ?? "";

        bool IsPlaying;
        bool IsLoaded;
        bool Loading;
        bool LoadEventPending;
        Task Reconfiguring = Task.CompletedTask;
        double Duration;
        int LoadGeneration;
        int ConfiguredHelper;
        int Recoveries;
        string? LastEffectsError;

        /// <summary>Chromecast plays the music itself, so local playback stands aside meanwhile.</summary>
        bool IsRemoteOutput => OutputDevice != "local" && OutputDevice != "airplay";

        MacHelper Helper
        {
            get
            {
                var helper = MacHelper.Instance;
                if (helper.Generation != ConfiguredHelper && LoadStatus == "success")
                {
                    // The helper was restarted (crashed); give it back our session and settings.
                    ConfiguredHelper = helper.Generation;
                    Reconfiguring = Reconfigure(helper);
                }
                return helper;
            }
        }

        public MusicKitAudioPlayer(string id) : base(id)
        {
            MacHelper.StateChanged += OnStateChanged;
            MacHelper.TrackEnded += OnTrackEnded;
            MacHelper.VariantChanged += OnVariantChanged;
            MacHelper.EffectsChanged += OnEffectsChanged;

            _ = Initialize();
        }

        async Task Initialize()
        {
            try
            {
                var helper = MacHelper.Instance;
                var restored = await MusicKitSession.Restore(helper);
                ConfiguredHelper = helper.Generation;
                LoadStatus = restored ? "success" : "failed";
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine("Couldn't start Apple Music playback: " + ex);
                LoadStatus = "failed";
            }
        }

        async Task Reconfigure(MacHelper helper)
        {
            try
            {
                await MusicKitSession.Restore(helper);
                IsLoaded = false;
                OwnsNowPlaying = false; // The new helper has published nothing; the reload republishes.
                await ResetSource();
                await UpdatePlaybackParameters();

                // Pick the track back up, but don't chase a helper that keeps crashing.
                var info = MediaPlaybackInfo.Instance;
                if (IsPlaying && info?.CurrentSong != null && ++Recoveries <= 3)
                {
                    await info.PlaySong(info.CurrentSong, info.CurrentSongIndex);
                }
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine("Couldn't restore Apple Music after a helper restart: " + ex.Message);
            }
        }

        #region Playback

        public override async Task SetSource(string src, WebWindow ctx)
        {
            await base.SetSource(src, ctx);
            if (Source == src) return;

            Source = src;
            HasLoaded = false;
            IsLoaded = false;
            IsPlaying = true;
            Duration = 0;

            if (string.IsNullOrEmpty(src)) return;

            // Like the web player, return straight away and report "loaded" once MusicKit is
            // playing the track. (MediaPlaybackInfo.PlaySong publishes the queue change to the
            // UI right after this returns; a duration reported before that gets overwritten.)
            _ = Load(src, ++LoadGeneration);
        }

        async Task Load(string src, int generation)
        {
            Loading = true;

            try
            {
                // A restarted helper has no developer token until Reconfigure hands it one, so
                // a load that overtook it failed ("MusicDataRequest.Error"), while the reload
                // Reconfigure does right after played fine.
                var helper = Helper;
                await Reconfiguring;
                if (generation != LoadGeneration || Source != src) return;

                var result = await helper.Send("load", new { playbackID = src, autoplay = !IsRemoteOutput });
                if (generation != LoadGeneration) return; // A newer track took over meanwhile.

                var ownsNowPlaying = result.Value<bool?>("ownNowPlaying") == true;
                if (ownsNowPlaying != OwnsNowPlaying)
                {
                    OwnsNowPlaying = ownsNowPlaying;
                    _ = RunOnPlayerThread(() => { _ = MacNowPlayingProvider.Refresh(); });
                }
                await Loaded(result.Value<double?>("duration") ?? 0);
            }
            catch (MacHelperException ex)
            {
                if (generation != LoadGeneration) return;

                // The helper died mid-load: touching Helper starts a new one, and Reconfigure
                // picks this track back up (it needs IsPlaying left as it is).
                if (MacHelper.RunningInstance?.Generation != ConfiguredHelper)
                {
                    _ = Helper;
                    return;
                }

                // Part of the load can fail after MusicKit is already playing the track. That
                // track is fine: treat it as loaded. Left unloaded, every state update was
                // ignored and pause stopped working.
                if (await IsHelperPlaying(src))
                {
                    Console.Error.WriteLine($"Apple Music load reported an error but is playing: {ex.Message}");
                    if (generation == LoadGeneration) await Loaded(0);
                    return;
                }

                // Really failed. Don't leave the UI saying "playing" over whatever MusicKit still
                // holds; pressing play retries (see PlayAudio).
                IsPlaying = false;
                Helper.Post("pause");

                // In a listening session one track that won't play here (region, account
                // restrictions) mustn't pause everyone: the session sits this one out.
                if (ListenTogether.ListenTogether.LoadFailed(src)) return;

                _ = MediaPlaybackInfo.Instance.Pause();
                ErrorHandler.DisplayError("Something went wrong with Apple Music", ex.Message);
            }
            finally
            {
                if (generation == LoadGeneration) Loading = false;
            }
        }

        async Task Loaded(double duration)
        {
            IsLoaded = true;
            Duration = duration;
            LoadEventPending = true; // Sent with the first state update, see OnStateChanged.
            await UpdatePlaybackParameters();

            // Paused while it was loading.
            if (!IsPlaying) Helper.Post("pause");
        }

        async Task<bool> IsHelperPlaying(string src)
        {
            try
            {
                var state = await Helper.Send("describe");
                return state.Value<string>("currentID") == src && state.Value<string>("status") == "playing";
            }
            catch (MacHelperException)
            {
                return false;
            }
        }

        public override async Task PlayAudio()
        {
            await base.PlayAudio();

            // The last load of this track failed: play is the retry.
            if (!IsLoaded && !Loading && !string.IsNullOrEmpty(Source))
            {
                IsPlaying = true;
                _ = Load(Source, ++LoadGeneration);
                return;
            }

            if (IsPlaying) return;

            IsPlaying = true;
            if (IsLoaded && !IsRemoteOutput) Helper.Post("play");
        }

        public override async Task PauseAudio()
        {
            await base.PauseAudio();
            if (!IsPlaying) return;

            IsPlaying = false;
            if (IsLoaded) Helper.Post("pause");
        }

        public override async Task SeekAudio(double time)
        {
            await base.SeekAudio(time);
            AssociatedWindow?.CallFunction("handleAudioEvent_" + ID, "timeupdate", time);
            Helper.Post("seek", new { time });
        }

        public override async Task SetLoopMode(bool loop)
        {
            await base.SetLoopMode(loop);
            Helper.Post("setRepeat", new { one = loop });
        }

        public override async Task SetOutputDevice(string outputDevice)
        {
            var wasRemote = IsRemoteOutput;
            await base.SetOutputDevice(outputDevice);

            if (IsRemoteOutput && !wasRemote)
            {
                Helper.Post("pause");
            }
            else if (!IsRemoteOutput && wasRemote && IsLoaded)
            {
                // Pick up where the cast device got to.
                Helper.Post("seek", new { time = MediaPlaybackInfo.Instance.Position.TotalSeconds });
                if (IsPlaying) Helper.Post("play");
            }
        }

        public override async Task SetVolume(double volume)
        {
            await base.SetVolume(volume);
            // The same perceptual curve FocalMK applies to the web player's volume.
            Helper.Post("setVolume", new { gain = Math.Pow(Math.Clamp(volume, 0, 1), 2) });
        }

        public override async Task SetSpeed(double speed)
        {
            await base.SetSpeed(speed);
            // Negative means "off but remembered". Like the web player, pitch follows speed.
            Helper.Post("setRate", new { rate = speed > 0 ? speed : 1, varispeed = true });
        }

        public override async Task SetFilterData(string filterData)
        {
            await base.SetFilterData(filterData);
            if (string.IsNullOrEmpty(filterData)) return;

            try
            {
                Helper.Post("setEffects", ParseEffects(filterData));
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine("Ignoring unreadable audio effects: " + ex.Message);
            }
        }

        // Atmos follows the "Dolby Atmos" setting of the Music app on macOS.
        public override async Task SetEnableAtmos(bool enabled) { }

        public override void Dispose()
        {
            MacHelper.StateChanged -= OnStateChanged;
            MacHelper.TrackEnded -= OnTrackEnded;
            MacHelper.VariantChanged -= OnVariantChanged;
            MacHelper.EffectsChanged -= OnEffectsChanged;

            LoadGeneration++;
            MacHelper.RunningInstance?.Post("stop");
            base.Dispose();
        }

        #endregion

        #region Helper events

        void OnStateChanged(JObject state)
        {
            if (!IsLoaded || state.Value<string>("id") != Source) return;

            var isPlaying = state.Value<string>("status") == "playing";
            var time = state.Value<double?>("time") ?? 0;
            var duration = state.Value<double?>("duration") ?? Duration;

            _ = RunOnPlayerThread(() =>
            {
                if (LoadEventPending)
                {
                    LoadEventPending = false;
                    _ = CallLoadEvent(duration);
                }
                _ = HandleTimeUpdate(isPlaying, time, duration);
            });
        }

        void OnTrackEnded(string playbackID)
        {
            if (playbackID != Source) return;

            // MusicKit is parked at the start now, so a later play() must actually resume it.
            IsPlaying = false;
            _ = RunOnPlayerThread(() => { _ = CallEndEvent(); });
        }

        void OnVariantChanged(string playbackID, string variant)
        {
            if (string.IsNullOrEmpty(playbackID) || playbackID != Source) return;

            // The badge is keyed by catalog id, the first part of "<catalog>/<library>" ids.
            var catalogID = playbackID.Split('/')[0];
            _ = PlayerStore.SetPlayerCallbackData($"atmos-state-{catalogID}", variant == "atmos" ? "active" : "");
        }

        void OnEffectsChanged(bool active, string? error)
        {
            if (string.IsNullOrEmpty(error) || error == LastEffectsError) return;

            LastEffectsError = error;
            ErrorHandler.DisplayError("Audio effects", error);
        }

        #endregion

        /// <summary>
        /// FocalSonic's effects format (see src-vite/src/utils/audioEffects.ts): a band array
        /// with the reverb level and impulse response id riding on the first band.
        /// </summary>
        static object ParseEffects(string filterData)
        {
            var bands = JArray.Parse(filterData).OfType<JObject>().Where((band) => band["freq"] != null).ToList();
            var head = bands.FirstOrDefault();
            var reverb = Math.Clamp(head?.Value<double?>("reverb") ?? 0, 0, 1); // Negative = off.

            return new
            {
                bands = bands.Select((band) => new
                {
                    type = band.Value<string>("type") ?? "PEAK",
                    freq = band.Value<double?>("freq") ?? 1000,
                    gain = band.Value<double?>("gain") ?? 0,
                    q = band.Value<double?>("q") ?? 1,
                }),
                reverb,
                impulse = reverb > 0 ? ImpulseOverrides.GetImpulseFilePath(head?.Value<string>("impulse")) : null,
            };
        }
    }
}

#endif
