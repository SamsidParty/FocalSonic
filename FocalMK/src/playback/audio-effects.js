
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
export function getAudioEffectController(source) {
    if (_effectInstances.has(source)) {
        return _effectInstances.get(source);
    }

    const reverb = new AudioEffectController(source, "spatial0");
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

        // Equalizer nodes (dynamic)
        this.eqNodes = [];
        // Default transition time (seconds) when changing filter parameters
        this.eqTransition = 0.05;
        // Reverb nodes
        this.convolver = this.audioCtx.createConvolver();
        this.wetGain = this.audioCtx.createGain();
        this.dryGain = this.audioCtx.createGain();
        this.wetGain.gain.value = wetLevel;
        this.dryGain.gain.value = 1 - wetLevel;
        this.reverbEnabled = false;


        // Load impulse response
        this._loadImpulseResponse(impulseUrl);

        // Connect nodes
        this._buildAudioGraph();

        // Resume context on user gesture
        if (this.isAudioElement) {
            this.audioCtx.resume();
        }
    }

    async _loadImpulseResponse(impulseUrl) {

        if (this._lastImpulseUrl == impulseUrl) return;
        this._lastImpulseUrl = impulseUrl;

        if (impulseUrl) {
            const realURL = window.igniteView?.resolverURL.replace("/dynamic", `/meta/impulse/${impulseUrl}.wav`);
            const response = await fetch(realURL);
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
        // Connect the source through the EQ chain (if any) to Dry and Wet paths.
        // This will create the routing but actual EQ nodes are managed by setFilters().
        this._rebuildConnections();
    }

    _disconnectNodeOutputs(node) {
        try {
            node.disconnect();
        } catch (e) {
            // ignore if node was not connected
        }
    }

    _rebuildConnections() {
        // Disconnect source outputs first to avoid duplicate connections
        this._disconnectNodeOutputs(this.sourceNode);

        if (this.eqNodes && this.eqNodes.length) {
            // Connect source -> first EQ
            this.sourceNode.connect(this.eqNodes[0]);

            // Chain EQ nodes
            for (let i = 0; i < this.eqNodes.length - 1; i++) {
                this._disconnectNodeOutputs(this.eqNodes[i]);
                this.eqNodes[i].connect(this.eqNodes[i + 1]);
            }

            // Connect last EQ to dry and wet paths
            const last = this.eqNodes[this.eqNodes.length - 1];
            this._disconnectNodeOutputs(last);
            last.connect(this.dryGain);
            last.connect(this.convolver);
        } else {
            // No EQ nodes: connect source directly to dry and wet
            this.sourceNode.connect(this.dryGain);
            this.sourceNode.connect(this.convolver);
        }

        // Ensure dry/wet go to destination
        this._disconnectNodeOutputs(this.dryGain);
        this.dryGain.connect(this.audioCtx.destination);

        this._disconnectNodeOutputs(this.convolver);
        this.convolver.connect(this.wetGain);
        this._disconnectNodeOutputs(this.wetGain);
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

    setFilters(filterData) {
        // Accepts an array of filter objects and updates the EQ chain.
        // Reuses existing nodes where possible and smoothly ramps params.
        if (!Array.isArray(filterData) || !this.audioCtx) return;

        const mapType = (t) => {
            if (!t) return 'peaking';
            const up = String(t).toUpperCase();
            switch (up) {
                case 'PEAK':
                case 'PEAKING':
                    return 'peaking';
                case 'LOWPASS':
                case 'LPF':
                    return 'lowpass';
                case 'HIGHPASS':
                case 'HPF':
                    return 'highpass';
                case 'LOWSHELF':
                case 'LSHELF':
                    return 'lowshelf';
                case 'HIGHSHELF':
                case 'HSHELF':
                    return 'highshelf';
                case 'BANDPASS':
                    return 'bandpass';
                case 'NOTCH':
                case 'BANDSTOP':
                    return 'notch';
                case 'ALLPASS':
                    return 'allpass';
                default:
                    return 'peaking';
            }
        };

        // Normalize input (filter objects with freq defined)
        const filters = filterData.filter(f => f && typeof f.freq !== 'undefined');
        const nyquist = this.audioCtx.sampleRate / 2;
        const now = this.audioCtx.currentTime;
        const transition = (typeof this.eqTransition === 'number') ? Math.max(0, this.eqTransition) : 0.05;

        // Ensure eqNodes array exists
        if (!this.eqNodes) this.eqNodes = [];

        // Reuse or create nodes up to filters.length
        for (let i = 0; i < filters.length; i++) {
            const f = filters[i];

            if (i == 0 && f.reverb) {
                this.setWetLevel(Math.min(Math.max(f.reverb, 0), 1));
            }
            if (i == 0 && f.impulse) {
                this._loadImpulseResponse(f.impulse);
            }

            let node = this.eqNodes[i];
            let created = false;
            if (!node) {
                node = this.audioCtx.createBiquadFilter();
                this.eqNodes[i] = node;
                created = true;
            }

            const targetType = mapType(f.type);
            if (node.type !== targetType) node.type = targetType;

            // Frequency
            const freqTarget = Math.max(10, Math.min(Number(f.freq) || 1000, nyquist));
            try { node.frequency.cancelScheduledValues(now); } catch (e) {}
            if (created) {
                node.frequency.setValueAtTime(freqTarget, now);
            } else {
                node.frequency.setValueAtTime(node.frequency.value, now);
                node.frequency.linearRampToValueAtTime(freqTarget, now + transition);
            }

            // Gain (dB)
            const gainTarget = (typeof f.gain === 'number') ? f.gain : 0;
            try { node.gain.cancelScheduledValues(now); } catch (e) {}
            if (created) {
                node.gain.setValueAtTime(gainTarget, now);
            } else {
                node.gain.setValueAtTime(node.gain.value, now);
                node.gain.linearRampToValueAtTime(gainTarget, now + transition);
            }

            // Q
            const qTarget = (typeof f.q === 'number') ? Math.max(0.0001, f.q) : 1;
            try { node.Q.cancelScheduledValues(now); } catch (e) {}
            if (created) {
                node.Q.setValueAtTime(qTarget, now);
            } else {
                node.Q.setValueAtTime(node.Q.value, now);
                node.Q.linearRampToValueAtTime(qTarget, now + transition);
            }
        }

        // If there are more existing nodes than desired, disconnect and remove extras
        if (this.eqNodes.length > filters.length) {
            for (let i = filters.length; i < this.eqNodes.length; i++) {
                try { this.eqNodes[i].disconnect(); } catch (e) {}
            }
            this.eqNodes.length = filters.length;
        }

        // Reconnect the audio graph (this will handle chaining)
        this._rebuildConnections();
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
