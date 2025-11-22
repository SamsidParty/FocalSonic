import Hls from "hls.js";
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
        audioElement.attachedHls = new Hls() as FocalHls;
        document.body.appendChild(audioElement);
    }
    return audioElement as FocalAudioElement;
}
