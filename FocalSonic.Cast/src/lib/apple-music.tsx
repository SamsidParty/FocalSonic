/* eslint-disable @typescript-eslint/no-explicit-any */

import type { ControlInterfaceInitializeResult } from "../types/control-interface";
import type PlaybackInterface from "../types/playback-interface";

declare global {
    interface Window {
        musicKitInstance?: any;
        MusicKit?: any;
        appleMusicDeveloperToken?: string;
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



const appleMusicPlaybackInterface: PlaybackInterface = {
    initialize: async (initData: ControlInterfaceInitializeResult) => {
        if (window.musicKitInstance || !window.MusicKit) throw new Error("No MusicKit available");

        window.musicKitInstance = {};

        const developerToken = getDeveloperToken();
        if (!developerToken) throw new Error("No developer token found");

        window.musicKitInstance = await window.MusicKit.configure({
                developerToken: developerToken,
                app: {
                    name: 'FocalSonic',
                    build: 'cast-1.0.0',
                },
            });

        // MusicKit instance is available
        console.log('MusicKit configured successfully:', window.musicKitInstance);

        // Authorize the user
        const userToken = initData?.playbackInterfaceToken || getUserToken();
        if (!userToken) throw new Error("No user token found");

        window.musicKitInstance.musicUserToken = userToken;

        await window.musicKitInstance.authorize();
        console.log('User authorized successfully!');

        window.musicKitInstance.setQueue({ song: "1679278167" });
        setTimeout(() => window.musicKitInstance.play(), 2000);
    }
}

export default appleMusicPlaybackInterface;