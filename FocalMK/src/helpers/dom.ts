import { FocalHls } from "./hls-instance";

const dummyAudioElement = document.createElement('audio') as FocalAudioElement;
dummyAudioElement.id = 'focalmk-dummy-audio-element';

export interface FocalAudioElement extends HTMLAudioElement {
    attachedHls?: FocalHls;
}

export function getAudioElement(): FocalAudioElement {
    let audioElement = document.getElementById('apple-music-player') as FocalAudioElement;

    if (!audioElement) {
        return dummyAudioElement;
    }
    
    return audioElement as FocalAudioElement;
}
