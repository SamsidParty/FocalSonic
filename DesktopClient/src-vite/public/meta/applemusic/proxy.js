
async function onMusicKitLoad() {
    console.log("[Aonsoku][Apple Music Proxy] Overriden MusicKit");

    let music = await MusicKit.configure({
        developerToken: "",
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
    window.MusicKit = undefined;

    document.documentElement.innerHTML = `
    <html>
        <head>
            <title>Apple Music Proxy</title>
        </head>
        <body>
            <h1>Proxy</h1>
        </body>
    </html>
    `.trim();

    const script = document.createElement("script");
    script.src = "https://music.apple.com/includes/js-cdn/musickit/v3/amp/musickit.js";
    script.onload = () => setTimeout(onMusicKitLoad, 0);
    document.head.appendChild(script);
}

overridePage();


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

    await igniteView.commandBridge.appleMusicRecieveTimeUpdate(window.proxyMusicInstance.isPlaying, window.proxyMusicInstance.currentPlaybackTime, window.proxyMusicInstance.currentPlaybackDuration);
};

setInterval(window.executeInjectedQueue, 250);