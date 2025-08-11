async function onMusicKitLoad() {
    console.log("[Aonsoku][Apple Music Proxy] Overriden MusicKit");

    let music = await MusicKit.configure({
        developerToken: window.foundDeveloperToken,
        app: {
            name: "Aonsoku",
            build: "AppleMusicProxy",
        },
    });

    music.userToken = window.injectedUserToken;
    await music.authorize();

    console.log("[Aonsoku][Apple Music Proxy] Auth status: " + (music.isAuthorized ? "Authorized" : "Not Authorized"));
    window.proxyMusicInstance = music;
};


async function overridePage() {

    console.log("[Aonsoku][Apple Music Proxy] Started overriding apple music page");
    window.startedOverride = true;
    window.MusicKit = undefined;

    document.documentElement.innerHTML = `
    <html>
        <head>
            <title>Apple Music Proxy</title>
        </head>
        <body>
            
        </body>
    </html>
    `.trim();

    const script = document.createElement("script");
    script.src = "https://music.apple.com/includes/js-cdn/musickit/v3/amp/musickit.js";
    script.onload = () => setTimeout(onMusicKitLoad, 0);
    document.head.appendChild(script);
}

function retrieveDefaultToken() {
    if (window.startedOverride) { return; }
    console.log("[Aonsoku][Apple Music Proxy] Started search for developer token");

    window.MusicKit.configure = async function (config) {
        const developerToken = config.developerToken;
        window.foundDeveloperToken = developerToken;
        console.log("[Aonsoku][Apple Music Proxy] Found developer token:", developerToken);
        console.log("[Aonsoku][Apple Music Proxy] Client info:", config);
        
        setTimeout(() => overridePage(), 0);
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
        else if (item.type === "setSource") {
            await window.proxyMusicInstance.stop();
            await window.proxyMusicInstance.playNext({ song: item.source }, true);
            await window.proxyMusicInstance.skipToNextItem();
        }
    }

    await igniteView.commandBridge.appleMusicRecieveTimeUpdate(window.proxyMusicInstance.isPlaying, document.getElementById("apple-music-player")?.currentTime || 0, window.proxyMusicInstance.currentPlaybackDuration);
};

setInterval(window.executeInjectedQueue, 250);