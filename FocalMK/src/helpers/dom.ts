import { FocalHls } from "./hls-instance";

export interface FocalAudioElement extends HTMLAudioElement {
    attachedHls?: FocalHls;
}

export function getAudioElement(): FocalAudioElement {
    let audioElement = document.getElementById('apple-music-player') as FocalAudioElement;

    if (!audioElement) {
        audioElement = document.createElement('audio') as FocalAudioElement;
        audioElement.id = 'apple-music-player';
        audioElement.className = 'focalmk-dummy-audio-element';
        // Don't create an HLS instance here - it will be created when needed by QueueItem
        document.body.appendChild(audioElement);
    }
    
    return audioElement as FocalAudioElement;
}
