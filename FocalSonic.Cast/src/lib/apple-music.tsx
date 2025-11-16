/* eslint-disable @typescript-eslint/no-explicit-any */

import type PlaybackInterface from "../types/playback-interface";

declare global {
    interface Window {
        musicKitInstance?: any;
        MusicKit?: any;
        appleMusicDeveloperToken?: string;
    }
}

function getUserToken(): string {
    return localStorage.musicUserToken;
}

function getDeveloperToken(): string {
    if (window.appleMusicDeveloperToken) {
        return window.appleMusicDeveloperToken;
    }
    return "";
}



const appleMusicPlaybackInterface: PlaybackInterface = {
    initialize: async () => {
        if (window.musicKitInstance || !window.MusicKit) return;

        window.musicKitInstance = {};

        window.musicKitInstance = await window.MusicKit.configure({
                developerToken: getDeveloperToken(),
                app: {
                    name: 'FocalSonic',
                    build: 'cast-1.0.0',
                },
            });

        // MusicKit instance is available
        console.log('MusicKit configured successfully:', window.musicKitInstance);

        // Authorize the user
        window.musicKitInstance.musicUserToken = getUserToken();

        await window.musicKitInstance.authorize();
    }
}

export default appleMusicPlaybackInterface;