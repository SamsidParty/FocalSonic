import { getAudioEffectController } from "../playback/audio-effects.js";

window.isCurrentSongRadio = false;

export function getMusicKit() {
    if (window.virtualMusicKit) {
        return window.virtualMusicKit;
    }
    return window.MusicKit;
}

export async function startAppleMusicProxy() {
    window.checkAuthStateInterval = setInterval(checkAuthState, 500);
}

async function onMusicKitLoad() {
    console.log("[FocalSonic][Apple Music Proxy] MusicKit available");
    console.log("[FocalSonic][Apple Music Proxy] Auth status: " + (window.proxyMusicInstance.isAuthorized ? "Authorized" : "Not Authorized"));
    window.igniteView?.commandBridge.setAppleMusicPlayerLoadStatus("success");

    window.proxyMusicInstance.addEventListener("playbackStateDidChange", ({ oldState, state }) => {
        console.log(`[FocalSonic][Apple Music Proxy] Playback changed from ${oldState} to ${state}`);
        if (state === getMusicKit().PlaybackStates.ended && window.proxyMusicInstance.repeatMode !== getMusicKit().PlayerRepeatMode.one) {
            window.igniteView?.commandBridge.appleMusicRecieveEndedEvent();
        }
        else if (state === getMusicKit().PlaybackStates.playing) {
            window.igniteView?.commandBridge.appleMusicRecieveLoadedEvent(window.proxyMusicInstance.currentPlaybackDuration);
        }
    });

    // This doesn't even work bruh and Apple has horrible documentation so I don't know how to fix it
    window.proxyMusicInstance.addEventListener("mediaPlaybackError", (error) => {
        console.error(`Apple music MKError: ${error}`);
    });

    window.addEventListener("unhandledrejection", function (e) {
        if (e.reason.name === "MKError") {
            window.igniteView?.commandBridge.displayError("Something went wrong with Apple Music", e.reason.reason);
            e.preventDefault();
        }
    })

};

async function checkAuthState() {
    const music = getMusicKit()?.getInstance();

    console.log("[FocalSonic][Apple Music Proxy] Checking auth:", music);
    if (music && music.musicUserToken && music.developerToken && music.isAuthorized) {
        clearInterval(window.checkAuthStateInterval);
        window.proxyMusicInstance = music;
        console.log("[FocalSonic][Apple Music Proxy] Found developer token:", music.developerToken);
        console.log("[FocalSonic][Apple Music Proxy] Found user token:", music.musicUserToken);

        window.foundDeveloperToken = music.developerToken;
        setTimeout(() => onMusicKitLoad(), 0);
    }
}

const findAudioElement = () => document.getElementById("apple-music-player");


window.executeInjectedQueue = async () => {
    if (!window.proxyMusicInstance) { return; }

    const itemsOfTypes = {};
    for (const item of window.injectedQueue) {
        if (!itemsOfTypes[item.type]) {
            itemsOfTypes[item.type] = [];
        }
        itemsOfTypes[item.type].push(item);
    }

    const limitTypeToOneItem = (type) => {
        // Only keep the last item of this type
        if (itemsOfTypes[type]?.length > 1) {
            const lastItem = itemsOfTypes[type][itemsOfTypes[type].length - 1];
            window.injectedQueue = window.injectedQueue.filter(item => item.type !== type);
            window.injectedQueue.push(lastItem);
        }
    }

    limitTypeToOneItem("setVolume");
    limitTypeToOneItem("setSpeed");
    limitTypeToOneItem("setReverb");

    while (window.injectedQueue.length > 0) {
        const item = window.injectedQueue.shift();
        console.log("[FocalSonic][Apple Music Proxy] Executing item:", item);
        
        if (item.type === "play") {
            if (window.pauseTimeout) { clearTimeout(window.pauseTimeout); window.pauseTimeout = null; }
            findAudioElement() && getAudioEffectController(findAudioElement()).adjustVolume(1);
            if (!window.proxyMusicInstance.isPlaying) {
                await window.proxyMusicInstance.play();
            }
        }
        else if (item.type === "pause") {
            if (window.pauseTimeout) { clearTimeout(window.pauseTimeout); window.pauseTimeout = null; }
            findAudioElement() && getAudioEffectController(findAudioElement()).adjustVolume(0);
            window.pauseTimeout = setTimeout(() => window.proxyMusicInstance.pause(), 420);
        }
        else if (item.type === "seek") {
            findAudioElement() && getAudioEffectController(findAudioElement()).resetFade();
            !!window.proxyMusicInstance.nowPlayingItem && await window.proxyMusicInstance.seekToTime(item.time);
        }
        else if (item.type === "setLoopMode") {
            window.proxyMusicInstance.repeatMode = item.loop ? getMusicKit().PlayerRepeatMode.one : getMusicKit().PlayerRepeatMode.none;
        }
        else if (item.type === "setEnableAtmos") {
            window.enableAtmos = item.enabled;
        }
        else if (item.type === "setVolume") {
            findAudioElement() && getAudioEffectController(findAudioElement()).setBaseVolume(item.volume);
        }
        else if (item.type === "setSpeed") {
            window.proxyMusicInstance.playbackRate = item.speed;
            findAudioElement() && (findAudioElement().preservesPitch = false);
        }
        else if (item.type === "setFilterData") {
            findAudioElement() && getAudioEffectController(findAudioElement()).setFilters(item.filterData);
        }
        else if (item.type === "setOutputDevice") {
            window.outputDevice = item.outputDevice;
            findAudioElement() && getAudioEffectController(findAudioElement()).updateVolume();
        }
        else if (item.type === "setSource") {
            findAudioElement() && getAudioEffectController(findAudioElement()).resetFade();
            await window.proxyMusicInstance.stop();

            if (!window.isCurrentSongRadio) {
                await window.proxyMusicInstance.clearQueue();
            }

            if (item.source.startsWith("ra.")) { // Radio station
                window.isCurrentSongRadio = true;
                await window.proxyMusicInstance.setQueue({ station: item.source });
                await window.proxyMusicInstance.play();
            }
            else {
                if (window.isCurrentSongRadio) {
                    await window.proxyMusicInstance.setQueue({ song: item.source });
                    await window.proxyMusicInstance.play();
                }
                else {
                    await window.proxyMusicInstance.playNext({ song: item.source }, true);
                    await window.proxyMusicInstance.skipToNextItem();
                }
                window.isCurrentSongRadio = false;
            }

        }
    }

    await window.igniteView?.commandBridge.appleMusicRecieveTimeUpdate(window.proxyMusicInstance.isPlaying, findAudioElement()?.currentTime || 0, window.proxyMusicInstance.currentPlaybackDuration);
};

setInterval(window.executeInjectedQueue, 250);