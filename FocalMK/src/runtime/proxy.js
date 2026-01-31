import { getAudioElement } from "../helpers/dom.js";
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
        if (state === getMusicKit().PlaybackStates.ended) {
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
            getAudioElement() && getAudioEffectController(getAudioElement()).adjustVolume(1);
            if (!window.proxyMusicInstance.isPlaying) {
                await window.proxyMusicInstance.play();
            }
        }
        else if (item.type === "pause") {
            if (window.pauseTimeout) { clearTimeout(window.pauseTimeout); window.pauseTimeout = null; }
            getAudioElement() && getAudioEffectController(getAudioElement()).adjustVolume(0);
            window.pauseTimeout = setTimeout(() => window.proxyMusicInstance.pause(), 420);
        }
        else if (item.type === "seek") {
            getAudioElement() && getAudioEffectController(getAudioElement()).resetFade();
            !!window.proxyMusicInstance.nowPlayingItem && await window.proxyMusicInstance.seekToTime(item.time);
        }
        else if (item.type === "setLoopMode") {
            window.proxyMusicInstance.repeatMode = item.loop ? getMusicKit().PlayerRepeatMode.one : getMusicKit().PlayerRepeatMode.none;
        }
        else if (item.type === "setEnableAtmos") {
            window.enableAtmos = item.enabled;
        }
        else if (item.type === "setVolume") {
            getAudioElement() && getAudioEffectController(getAudioElement()).setBaseVolume(item.volume);
        }
        else if (item.type === "setSpeed") {
            if (item.speed < 0) { item.speed = 1; }
            window.proxyMusicInstance.playbackRate = item.speed;
            getAudioElement() && (getAudioElement().preservesPitch = false);
        }
        else if (item.type === "setFilterData") {
            getAudioElement() && getAudioEffectController(getAudioElement()).setFilters(item.filterData);
        }
        else if (item.type === "setOutputDevice") {
            window.outputDevice = item.outputDevice;
            getAudioElement() && getAudioEffectController(getAudioElement()).updateVolume();
        }
        else if (item.type === "setSource") {
            getAudioElement() && getAudioEffectController(getAudioElement()).resetFade();
            await window.proxyMusicInstance.stop();

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
        else if (item.type === "preloadNextSource") {
            await window.proxyMusicInstance.preloadNextSource?.({ song: item.source });
        }
        else if (item.type === "transitionSources") {
            window.proxyMusicInstance.transitionSources?.(item.duration);
        }
    }

    await window.igniteView?.commandBridge.appleMusicRecieveTimeUpdate(window.proxyMusicInstance.isPlaying, getAudioElement()?.currentTime || 0, window.proxyMusicInstance.currentPlaybackDuration);
};

setInterval(window.executeInjectedQueue, 250);