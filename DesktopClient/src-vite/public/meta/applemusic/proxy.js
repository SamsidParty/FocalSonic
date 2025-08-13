
async function onMusicKitLoad() {
    console.log("[Aonsoku][Apple Music Proxy] MusicKit available");
    console.log("[Aonsoku][Apple Music Proxy] Auth status: " + (window.proxyMusicInstance.isAuthorized ? "Authorized" : "Not Authorized"));
    igniteView.commandBridge.setAppleMusicPlayerLoadStatus("success");

    window.proxyMusicInstance.addEventListener("playbackStateDidChange", ({ oldState, state }) => {
        console.log(`[Aonsoku][Apple Music Proxy] Playback changed from ${oldState} to ${state}`);
        if (state === MusicKit.PlaybackStates.ended && window.proxyMusicInstance.repeatMode !== MusicKit.PlayerRepeatMode.one) {
            igniteView?.commandBridge.appleMusicRecieveEndedEvent();
        }
        else if (state === MusicKit.PlaybackStates.playing) {
            igniteView?.commandBridge.appleMusicRecieveLoadedEvent(window.proxyMusicInstance.currentPlaybackDuration);
        }
    });

};

async function checkAuthState() {
    const music = MusicKit?.getInstance();

    if (music && music.isAuthorized && music.musicUserToken && music.developerToken) {
        clearInterval(window.checkAuthStateInterval);
        window.proxyMusicInstance = music;
        console.log("[Aonsoku][Apple Music Proxy] Found developer token:", music.developerToken);
        console.log("[Aonsoku][Apple Music Proxy] Found user token:", music.musicUserToken);

        window.foundDeveloperToken = music.developerToken;
        localStorage.setItem("applemusic_developer_token", music.developerToken);
        igniteView.commandBridge.loadAppleMusicKeys();
        setTimeout(() => onMusicKitLoad(), 0);
    }
}

window.checkAuthStateInterval = setInterval(checkAuthState, 500);


window.executeInjectedQueue = async () => {
    if (!window.proxyMusicInstance) { return; }

    while (window.injectedQueue.length > 0) {
        const item = window.injectedQueue.shift();
        console.log("[Aonsoku][Apple Music Proxy] Executing item:", item);
        
        if (item.type === "play") {
            await window.proxyMusicInstance.play();
        }
        else if (item.type === "pause") {
            await window.proxyMusicInstance.pause();
        }
        else if (item.type === "seek") {
            !!window.proxyMusicInstance.nowPlayingItem && await window.proxyMusicInstance.seekToTime(item.time);
        }
        else if (item.type === "setLoopMode") {
            window.proxyMusicInstance.repeatMode = item.loop ? MusicKit.PlayerRepeatMode.one : MusicKit.PlayerRepeatMode.none;
        }
        else if (item.type === "setSource") {
            await window.proxyMusicInstance.stop();
            await window.proxyMusicInstance.clearQueue();
            await window.proxyMusicInstance.playNext({ song: item.source }, true);
            await window.proxyMusicInstance.skipToNextItem();
        }
    }

    await igniteView.commandBridge.appleMusicRecieveTimeUpdate(window.proxyMusicInstance.isPlaying, document.getElementById("apple-music-player")?.currentTime || 0, window.proxyMusicInstance.currentPlaybackDuration);
};

setInterval(window.executeInjectedQueue, 250);