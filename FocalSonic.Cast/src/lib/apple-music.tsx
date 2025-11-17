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
            
            alert(music.storefrontCountryCode);
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
}

const appleMusicPlaybackInterface: PlaybackInterface = {
    setSource: async (initData: MediaSourceData) => {
        await authenticate(initData);

        window.musicKitInstance.setQueue({ song: initData.songId });
        setTimeout(() => window.musicKitInstance.play(), 2000);
    }
}

export default appleMusicPlaybackInterface;