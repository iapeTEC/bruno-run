// Audio synthesizer using Web Audio API for Bruno Run
class SoundController {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.engineOsc = null;
        this.engineGain = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
                this.startEngineDrone();
                this.initialized = true;
            }
        } catch (e) {
            console.warn("Web Audio API not supported", e);
        }
    }

    startEngineDrone() {
        if (!this.ctx || this.engineOsc) return;
        try {
            this.engineOsc = this.ctx.createOscillator();
            this.engineOsc2 = this.ctx.createOscillator();
            this.engineGain = this.ctx.createGain();

            this.engineOsc.type = 'sawtooth';
            this.engineOsc.frequency.setValueAtTime(65, this.ctx.currentTime);

            this.engineOsc2.type = 'sine';
            this.engineOsc2.frequency.setValueAtTime(130, this.ctx.currentTime);

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(260, this.ctx.currentTime);

            this.engineGain.gain.setValueAtTime(this.muted ? 0 : 0.08, this.ctx.currentTime);

            this.engineOsc.connect(filter);
            this.engineOsc2.connect(filter);
            filter.connect(this.engineGain);
            this.engineGain.connect(this.ctx.destination);

            this.engineOsc.start();
            this.engineOsc2.start();
        } catch (e) {
            console.warn("Engine sound failed", e);
        }
    }

    updateEngine(speedFactor, isBoosted) {
        if (!this.ctx || !this.engineOsc || this.muted) return;
        const now = this.ctx.currentTime;
        const baseFreq = isBoosted ? 140 : 65 + (speedFactor * 35);
        this.engineOsc.frequency.setTargetAtTime(baseFreq, now, 0.1);
        this.engineOsc2.frequency.setTargetAtTime(baseFreq * 2, now, 0.1);
        this.engineGain.gain.setTargetAtTime(isBoosted ? 0.15 : 0.08, now, 0.1);
    }

    playBoostSound() {
        if (!this.ctx || this.muted) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(120, now);
            osc.frequency.exponentialRampToValueAtTime(520, now + 0.4);

            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 1.2);

            // Plasma white noise whoosh
            this.playNoiseWhoosh(0.8);
        } catch (e) {}
    }

    playNoiseWhoosh(duration = 0.5) {
        if (!this.ctx || this.muted) return;
        try {
            const bufferSize = this.ctx.sampleRate * duration;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(800, this.ctx.currentTime);
            filter.frequency.exponentialRampToValueAtTime(2400, this.ctx.currentTime + duration);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            noise.start();
        } catch (e) {}
    }

    playCrashSound() {
        if (!this.ctx || this.muted) return;
        try {
            const now = this.ctx.currentTime;

            // Heavy low impact
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.exponentialRampToValueAtTime(20, now + 0.7);

            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.8);

            // Shatter noise
            this.playNoiseWhoosh(1.0);
        } catch (e) {}
    }

    playUpgradeSound() {
        if (!this.ctx || this.muted) return;
        try {
            const notes = [261.6, 329.6, 392.0, 523.3, 659.3];
            notes.forEach((freq, idx) => {
                const now = this.ctx.currentTime + (idx * 0.08);
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now);

                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.35);
            });
        } catch (e) {}
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.engineGain) {
            this.engineGain.gain.setValueAtTime(this.muted ? 0 : 0.08, this.ctx.currentTime);
        }
        return this.muted;
    }
}

window.soundCtrl = new SoundController();
