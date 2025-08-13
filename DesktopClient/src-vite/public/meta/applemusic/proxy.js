
async function onMusicKitLoad() {

    console.log("[Aonsoku][Apple Music Proxy] MusicKit available");
    console.log("[Aonsoku][Apple Music Proxy] Auth status: " + (window.proxyMusicInstance.isAuthorized ? "Authorized" : "Not Authorized"));

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


async function overridePage() {
    console.log("[Aonsoku][Apple Music Proxy] Started overriding apple music page");
    window.startedOverride = true;

    document.documentElement.innerHTML = `
    <html>
        <head>
            <title>Apple Music Proxy</title>
        </head>
        <body>
            
        </body>
    </html>
    `.trim();

    onMusicKitLoad();
}

function retrieveDefaultToken() {
    if (window.startedOverride) { return; }
    console.log("[Aonsoku][Apple Music Proxy] Started search for developer token");

    const originalConfigure = window.MusicKit.configure;
    window.MusicKit.configure = async function (config) {
        const instancePromise = originalConfigure.call(this, config);

        const developerToken = config.developerToken;
        window.foundDeveloperToken = developerToken;
        console.log("[Aonsoku][Apple Music Proxy] Found developer token:", developerToken);
        console.log("[Aonsoku][Apple Music Proxy] Client info:", config);
        window.capturedConfig = config;
        
        instancePromise.then((music) => {
            window.proxyMusicInstance = music;
            setTimeout(() => overridePage(), 0);
        }); 

        return instancePromise;
    };
}


if (window.MusicKit) {
    retrieveDefaultToken();
} else {
    document.addEventListener("musickitloaded", retrieveDefaultToken);
}


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