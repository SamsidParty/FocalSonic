
function swing(p) {
    return 0.5 - Math.cos(p * Math.PI) / 2;
}

const _effectInstances = new WeakMap();

/**
 * Returns an existing AudioEffectController for the given audio source, or creates a new one if none exists.
 * @param {HTMLAudioElement|AudioNode} source - The audio element or Web Audio node
 * @param {String|null} impulseUrl - Optional impulse response URL
 * @param {Number} wetLevel - Initial wet/dry mix (0-1)
 * @returns {AudioEffectController} - AudioEffectController instance
 */
function getAudioEffectController(source) {
    if (_effectInstances.has(source)) {
        return _effectInstances.get(source);
    }

    const reverb = new AudioEffectController(source);
    _effectInstances.set(source, reverb);
    return reverb;
}

class AudioEffectController {

    baseVolume = 1.0;

    /**
     * @param {HTMLAudioElement|AudioNode} source - The audio element or web audio source node
     * @param {String|null} impulseUrl - Optional URL of the impulse response
     * @param {Number} wetLevel - Initial wet/dry mix (0 = no reverb, 1 = fully wet)
     */
    constructor(source, impulseUrl = null, wetLevel = 0) {

        console.log("[FocalSonic] Initializing AudioEffectController");

        this.rawSource = source;
        this.isAudioElement = source instanceof HTMLAudioElement;

        this.audioCtx = this.isAudioElement
            ? new (window.AudioContext || window.webkitAudioContext)()
            : source.context;

        this.sourceNode = this.isAudioElement
            ? this.audioCtx.createMediaElementSource(source)
            : source;

        this.fadeGain = 1.0;

        // Reverb nodes
        this.convolver = this.audioCtx.createConvolver();
        this.wetGain = this.audioCtx.createGain();
        this.dryGain = this.audioCtx.createGain();
        this.wetGain.gain.value = wetLevel;
        this.dryGain.gain.value = 1 - wetLevel;
        this.reverbEnabled = false;

        // EQ nodes
        this.filters = {
            low: this.audioCtx.createBiquadFilter(),
            mid: this.audioCtx.createBiquadFilter(),
            high: this.audioCtx.createBiquadFilter()
        };
        this.filters.low.type = 'lowshelf';
        this.filters.mid.type = 'peaking';
        this.filters.high.type = 'highshelf';
        this.filters.low.frequency.value = 200;
        this.filters.mid.frequency.value = 1000;
        this.filters.high.frequency.value = 5000;
        this.filters.mid.Q.value = 1; // quality factor for mid band

        // Load impulse response
        this._loadImpulseResponse(impulseUrl);

        // Connect nodes
        this._buildAudioGraph();

        // Resume context on user gesture
        if (this.isAudioElement) {
            const resumeContext = () => {
                this.audioCtx.resume();
                document.removeEventListener('click', resumeContext);
            };
            document.addEventListener('click', resumeContext);
        }
    }

    async _loadImpulseResponse(impulseUrl) {
        if (impulseUrl) {
            const response = await fetch(impulseUrl);
            const arrayBuffer = await response.arrayBuffer();
            this.convolver.buffer = await this.audioCtx.decodeAudioData(arrayBuffer);
        } else {
            // Synthetic IR
            const length = this.audioCtx.sampleRate * 3;
            const impulse = this.audioCtx.createBuffer(2, length, this.audioCtx.sampleRate);
            for (let ch = 0; ch < impulse.numberOfChannels; ch++) {
                const data = impulse.getChannelData(ch);
                for (let i = 0; i < length; i++) {
                    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
                }
            }
            this.convolver.buffer = impulse;
        }
    }

    _buildAudioGraph() {
        // Source → EQ → Dry & Wet
        let eqChain = this.sourceNode;
        for (const band of ['low', 'mid', 'high']) {
            eqChain.connect(this.filters[band]);
            eqChain = this.filters[band];
        }

        // Dry path
        eqChain.connect(this.dryGain);
        this.dryGain.connect(this.audioCtx.destination);

        // Wet path
        eqChain.connect(this.convolver);
        this.convolver.connect(this.wetGain);
        this.wetGain.connect(this.audioCtx.destination);
    }

    // Reverb methods
    enableReverb() { this.reverbEnabled = true; }
    disableReverb() { this.reverbEnabled = false; }
    toggleReverb() { this.reverbEnabled ? this.disableReverb() : this.enableReverb(); }
    setWetLevel(value) {
        if (value > 0) { this.enableReverb(); }
        else { this.disableReverb(); return; }
        this.wetGain.gain.value = Math.min(Math.max(value, 0), 1);
        this.dryGain.gain.value = 1 - this.wetGain.gain.value;
    }

    // EQ methods
    setLowGain(db) { this.filters.low.gain.value = db; }
    setMidGain(db) { this.filters.mid.gain.value = db; }
    setHighGain(db) { this.filters.high.gain.value = db; }

    // Optional: set all EQ at once
    setEQ(lowDb, midDb, highDb) {
        this.setLowGain(lowDb);
        this.setMidGain(midDb);
        this.setHighGain(highDb);
    }

    setBaseVolume(level) {
        this.baseVolume = level;
        this.updateVolume();
    }

    updateVolume() {
        let muteVolume = 1.0;

        if (window.outputDevice && !window.outputDevice.includes("local")) {
            muteVolume = 0.0; // Mute local audio when outputting to external device (eg. chromecast)
        }

        this.rawSource.volume = this.baseVolume * this.fadeGain * muteVolume;
    }

    resetFade() {
        if (window.fadeTimer) { 
            clearInterval(window.fadeTimer);
            window.fadeTimer = null; 
        }
        this.fadeGain = 1;
        this.updateVolume();
    }

    adjustVolume(
        newVolume,
        duration = 400,
        easing = swing,
        interval = 13,
    ) {

        if (window.fadeTimer) { 
            clearInterval(window.fadeTimer);
            window.fadeTimer = null; 
            this.fadeGain = newVolume;
            this.updateVolume();
            return;
        }

        const originalVolume = this.fadeGain;
        const delta = newVolume - originalVolume;

        if (!delta || !duration || !easing || !interval) {
            this.fadeGain = newVolume;
            this.updateVolume();
            return Promise.resolve();
        }

        const ticks = Math.floor(duration / interval);
        let tick = 1;

        return new Promise(resolve => {
            const timer = setInterval(() => {
                this.fadeGain = originalVolume + (
                    easing(tick / ticks) * delta
                );
                this.updateVolume();

                if (++tick === ticks + 1) {
                    clearInterval(timer);
                    window.fadeTimer = null;
                    resolve();
                }
            }, interval);
            window.fadeTimer = timer;
        });
    }

}

export { getAudioEffectController };
