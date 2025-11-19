/* eslint-disable no-async-promise-executor */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { ControlInterfacePacket } from "../types/control-interface";
import type PlaybackInterface from "../types/playback-interface";
import type { Status } from "../types/status";

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

function updateStatus() {
    if (window.setCurrentStatus && window.musicKitInstance?.nowPlayingItem && !window.currentStatus?.isError) {

        const nowPlaying = window.musicKitInstance.nowPlayingItem.attributes;

        window.setCurrentStatus({
            metadata: {
                playbackInterface: "applemusic",
                title: nowPlaying.name,
                artist: nowPlaying.artistName,
                album: nowPlaying.albumName,
                mediaId: window.musicKitInstance.nowPlayingItem.id,
                currentTime: findAudioElement()?.currentTime || 0,
                timeSync: Date.now(),
                artworkUrl: nowPlaying.artwork?.url
                    .replace("{w}", "500")
                    .replace("{h}", "500"),
            }
        } as Status);
    }
    setTimeout(updateStatus, 1000);
}

async function authenticate(credentials?: string) {
    if (!window.musicKitInstance && credentials) {
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
            console.log('MusicKit configured successfully');

            // Authorize the user
            if (!credentials) throw new Error("No user token found");
            music.musicUserToken = credentials;
            
            await music.authorize();
            console.log('User authorized successfully!');
            
            window.musicKitInstance = music;
            window.appleMusicReady = true;
            resolve();
            updateStatus();
        });
    }
    else if (!window.musicKitInstance?.setQueue || !window.appleMusicReady) {
        await window.appleMusicReadyPromise;
    }

    // If window.musicKitInstance.setQueue is still not available, wait until it is
    if (!window.musicKitInstance?.setQueue) {
        await new Promise<void>((resolve) => {
            const checkInterval = setInterval(() => {
                if (window.musicKitInstance?.setQueue) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        });
    }


}

const appleMusicPlaybackInterface: PlaybackInterface = {
    handleEvent: async (event: ControlInterfacePacket) => {


        // Auth
        if (event.type === "setCredentials") { 
            const token = event.data[1];
            await authenticate(token || getUserToken());
        }
        else {
            await authenticate();
        }


        if (event.type === "setSource") {

            const songID = event.data[0];
            const seekTime = event.data[1];
            if (!songID) return;

            window.lastSongID = songID;

            await window.musicKitInstance.stop();
            await window.musicKitInstance.playNext({ song: songID }, true);
            await window.musicKitInstance.skipToNextItem();
            window.musicKitInstance.repeatMode = window.MusicKit.PlayerRepeatMode.none;

            if (seekTime && parseFloat(seekTime) > 0.5) {
                await window.musicKitInstance.seekToTime(parseFloat(seekTime));
            }
        }
        else if (event.type === "play") {
            if (!window.musicKitInstance.isPlaying) {
                await window.musicKitInstance.play();
            }
        }
        else if (event.type === "pause") {
            await window.musicKitInstance.pause();
        }
        else if (event.type === "seek") {
            if (window.musicKitInstance.nowPlayingItem) await window.musicKitInstance.seekToTime(parseFloat(event.data[0]));
        }
    }
}

export default appleMusicPlaybackInterface;