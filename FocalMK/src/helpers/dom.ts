export function getAudioElement(): HTMLAudioElement {
    let audioElement = document.getElementById('apple-music-player');
    if (!audioElement) {
        audioElement = document.createElement('audio');
        audioElement.id = 'apple-music-player';
        audioElement.className = 'focalmk-audio-element';
        document.body.appendChild(audioElement);
    }
    return audioElement as HTMLAudioElement;
}
