import { MusicKit } from "../virtualmk/virtualmk";


declare global {
    interface Window {
        MusicKit?: MusicKit;
        checkAuthStateInterval?: number;
        proxyMusicInstance?: MusicKit;
        foundDeveloperToken?: string;
    }
}

async function checkAuthState() {
    const music = window.MusicKit?.getInstance();

    if (music && music.isAuthorized && music.musicUserToken && music.developerToken) {
        clearInterval(window.checkAuthStateInterval);
        console.log("[FocalSonic][Apple Music Auth] Found developer token:", music.developerToken);
        console.log("[FocalSonic][Apple Music Auth] Found user token:", music.musicUserToken);

        window.foundDeveloperToken = music.developerToken;
        await window.igniteView?.commandBridge.saveAppleMusicDeveloperKey(music.developerToken);

        window.location.href = window.igniteView?.resolverURL.replace("/dynamic", "/meta/applemusic/proxy.html");
    }
}

// Finds the apple music tokens in order to play music through the proxy
export function startTokenGrabber() {
    window.checkAuthStateInterval = setInterval(checkAuthState, 500);
}