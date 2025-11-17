/* eslint-disable no-async-promise-executor */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { MediaSourceData } from "../types/control-interface";
import type PlaybackInterface from "../types/playback-interface";



declare global {
    interface Window {
        musicKitInstance?: any;
        MusicKit?: any;
        appleMusicDeveloperToken?: string;
        appleMusicReady?: boolean;
        appleMusicReadyPromise?: Promise<void>;
        isCurrentSongRadio?: boolean;
        lastSongID?: string;
    }
}

// For testing
function getUserToken(): string {
    return localStorage.musicUserToken;
}

function getDeveloperToken(): string {
    if (window.appleMusicDeveloperToken) {
        return window.appleMusicDeveloperToken;
    }
    return "";
}

const findAudioElement = () => document.getElementById("apple-music-player") as HTMLMediaElement;

function debug() {
    
}
setInterval(debug, 500);

async function authenticate(initData: MediaSourceData) {
    if (!window.musicKitInstance) {
        window.musicKitInstance = {};
        window.appleMusicReadyPromise = new Promise(async (resolve) => {

            const developerToken = getDeveloperToken();
            if (!developerToken) throw new Error("No developer token found");

            const music = await window.MusicKit.configure({
                    developerToken: developerToken,
                    app: {
                        name: 'FocalSonic',
                        build: 'cast-1.0.0',
                    },
                });

            // MusicKit instance is available
            console.log('MusicKit configured successfully:', music);

            // Authorize the user
            const userToken = initData?.credentials || getUserToken();
            if (!userToken) throw new Error("No user token found");
            music.musicUserToken = userToken;
            
            await music.authorize();
            console.log('User authorized successfully!');
            
            window.musicKitInstance = music;
            window.appleMusicReady = true;
            resolve();
        });
    }
    else if (!window.musicKitInstance.setQueue || !window.appleMusicReady) {
        await window.appleMusicReadyPromise;
    }

    // If window.musicKitInstance.setQueue is still not available, wait until it is
    if (!window.musicKitInstance.setQueue) {
        await new Promise<void>((resolve) => {
            const checkInterval = setInterval(() => {
                if (window.musicKitInstance.setQueue) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        });
    }

    window.musicKitInstance.addEventListener("mediaElementCreated", window.assignAudioElement);
}

const appleMusicPlaybackInterface: PlaybackInterface = {
    setSource: async (initData: MediaSourceData) => {
        await authenticate(initData);

        if (!initData.songId) return;

        window.lastSongID = initData.songId;

        await window.musicKitInstance.stop();
        await window.musicKitInstance.playNext({ song: initData.songId }, true);
        await window.musicKitInstance.skipToNextItem();
    }
}

export default appleMusicPlaybackInterface;