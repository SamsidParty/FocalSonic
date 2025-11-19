/* eslint-disable no-async-promise-executor */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { ControlInterfacePacket } from "../types/control-interface";
import type PlaybackInterface from "../types/playback-interface";

window.onerror = function(message, source, lineno, colno, error) {
    // Construct the error message for the alert
    let errorMessage = `Error: ${message}\n`;
    errorMessage += `Source: ${source}\n`;
    errorMessage += `Line: ${lineno}, Column: ${colno}`;

    // If an Error object is available (modern browsers), you can also include its details
    if (error && error.stack) {
        errorMessage += `\nStack: ${error.stack}`;
    }

    // Display the alert
    alert(errorMessage);

    // Return true to prevent the default browser error handling (e.g., logging to console)
    return true;
};

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

async function authenticate(credentials: string) {
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
            const userToken = credentials || getUserToken();
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


}

const appleMusicPlaybackInterface: PlaybackInterface = {
    handleEvent: async (event: ControlInterfacePacket) => {


        if (event.type === "setSource") {
            const token = event.data[1];
            const songID = event.data[2];

            await authenticate(token);

            if (!songID) return;

            window.lastSongID = songID;

            await window.musicKitInstance.stop();
            await window.musicKitInstance.playNext({ song: songID }, true);
            await window.musicKitInstance.skipToNextItem();
        }
        else if (event.type === "play") {
            if (!window.musicKitInstance.isPlaying) {
                await window.musicKitInstance.play();
            }
        }
        else if (event.type === "pause") {
            await window.musicKitInstance.pause();
        }

    }
}

export default appleMusicPlaybackInterface;